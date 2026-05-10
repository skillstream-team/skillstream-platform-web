import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';
import { asText, toNumber } from './helpers.js';

type InsightItem = {
  id: string;
  text: string;
  tone: 'info' | 'attention' | 'success';
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return json(500, { error: 'Missing server configuration' });
  }

  const authHeader = req.headers.get('Authorization') || '';
  const jwt = authHeader.replace('Bearer ', '').trim();
  if (!jwt) {
    return json(401, { error: 'Missing bearer token' });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: authData, error: authError } = await admin.auth.getUser(jwt);
  if (authError || !authData.user) {
    return json(401, { error: 'Invalid token' });
  }

  const userId = authData.user.id;
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', userId)
    .maybeSingle();
  if (profileError || !profile) {
    return json(404, { error: 'Profile not found' });
  }

  const { data: studyAssistFlag, error: studyAssistFlagError } = await admin
    .from('admin_feature_flags')
    .select('enabled, rollout')
    .eq('key', 'study_assist')
    .maybeSingle();
  if (studyAssistFlagError) {
    return json(500, { error: 'Could not evaluate assistant feature availability.' });
  }
  if (profile.role !== 'admin' && !studyAssistFlag) {
    return json(403, { error: 'Assistant is currently unavailable.' });
  }
  if (profile.role !== 'admin' && studyAssistFlag) {
    const allowedByRollout =
      studyAssistFlag.rollout === 'all'
      || (studyAssistFlag.rollout === 'teachers' && profile.role === 'teacher')
      || (studyAssistFlag.rollout === 'students' && profile.role === 'student');
    if (!studyAssistFlag.enabled || !allowedByRollout) {
      return json(403, { error: 'Assistant is currently disabled for your account.' });
    }
  }

  const { data: rateAllowed, error: rateError } = await admin.rpc('check_rate_limit', {
    p_key: `ai-insights:${userId}`,
    p_limit: 20,
    p_window_seconds: 60,
  });
  if (rateError) {
    return json(500, { error: 'Rate-limit check failed', details: rateError.message });
  }
  if (!rateAllowed) {
    return json(429, { error: 'Rate limit exceeded' });
  }

  let insights: InsightItem[] = [];

  if (profile.role === 'admin') {
    const [{ data: users }, { data: reports }] = await Promise.all([
      admin.rpc('admin_list_users', { p_limit: 500, p_offset: 0 }),
      admin.from('admin_reports').select('name, generated_at').order('generated_at', { ascending: false }).range(0, 2),
    ]);

    const rows = (users || []) as Array<Record<string, unknown>>;
    const totalStudents = rows.filter((row) => asText(row.role) === 'STUDENT').length;
    const needsAttention = rows.filter((row) => asText(row.role) === 'STUDENT' && asText(row.status) === 'needs_attention').length;
    const pausedTeachers = rows.filter((row) => asText(row.role) === 'TEACHER' && asText(row.status) === 'paused').length;
    const avgClassesPerTeacher = (() => {
      const teachers = rows.filter((row) => asText(row.role) === 'TEACHER');
      if (teachers.length === 0) return 0;
      const totalClasses = teachers.reduce((sum, row) => sum + toNumber(row.classes_count), 0);
      return Math.round((totalClasses / teachers.length) * 10) / 10;
    })();

    insights = [
      needsAttention > 0
        ? {
            id: 'attention',
            text: `${needsAttention} learner${needsAttention === 1 ? '' : 's'} need follow-up today.`,
            tone: 'attention',
          }
        : {
            id: 'attention',
            text: 'No learners are flagged for urgent support right now.',
            tone: 'success',
          },
      {
        id: 'capacity',
        text: `Average teacher load is ${avgClassesPerTeacher} classes per teacher.`,
        tone: 'info',
      },
      pausedTeachers > 0
        ? {
            id: 'teacher-status',
            text: `${pausedTeachers} teacher account${pausedTeachers === 1 ? '' : 's'} are paused.`,
            tone: 'attention',
          }
        : {
            id: 'teacher-status',
            text: 'All teacher accounts are active.',
            tone: 'success',
          },
      {
        id: 'coverage',
        text: `You currently have ${totalStudents} active student profile${totalStudents === 1 ? '' : 's'}.`,
        tone: 'info',
      },
      reports && reports.length > 0
        ? {
            id: 'report',
            text: `Latest report: ${asText(reports[0].name)}.`,
            tone: 'info',
          }
        : {
            id: 'report',
            text: 'Generate a report snapshot to benchmark this week.',
            tone: 'info',
          },
    ];
  } else if (profile.role === 'teacher') {
    const { data: memberships } = await admin
      .from('class_members')
      .select('class_id')
      .eq('user_id', userId)
      .eq('member_role', 'teacher')
      .range(0, 99);
    const classIds = (memberships || []).map((row) => row.class_id as string);

    const [{ data: students }, { data: lessons }, { data: assignments }] = await Promise.all([
      classIds.length > 0
        ? admin.from('class_members').select('user_id').in('class_id', classIds).eq('member_role', 'student').range(0, 2000)
        : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
      classIds.length > 0
        ? admin.from('lessons').select('scheduled_at').in('class_id', classIds).gte('scheduled_at', new Date().toISOString()).range(0, 99)
        : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
      classIds.length > 0
        ? admin.from('class_assignments').select('submissions_pending_review, completion_rate').in('class_id', classIds).range(0, 99)
        : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    ]);

    const studentIds = new Set((students || []).map((row) => row.user_id as string));
    const upcomingLessons = (lessons || []).length;
    const pendingReviews = (assignments || []).reduce((sum, row) => sum + toNumber(row.submissions_pending_review), 0);
    const avgCompletion = (() => {
      if (!assignments || assignments.length === 0) return 0;
      const total = assignments.reduce((sum, row) => sum + toNumber(row.completion_rate), 0);
      return Math.round(total / assignments.length);
    })();

    insights = [
      {
        id: 'students',
        text: `You currently teach ${studentIds.size} learner${studentIds.size === 1 ? '' : 's'}.`,
        tone: 'info',
      },
      upcomingLessons > 0
        ? {
            id: 'lessons',
            text: `${upcomingLessons} upcoming lesson${upcomingLessons === 1 ? '' : 's'} are scheduled.`,
            tone: 'info',
          }
        : {
            id: 'lessons',
            text: 'No upcoming lessons are scheduled yet.',
            tone: 'attention',
          },
      pendingReviews > 0
        ? {
            id: 'reviews',
            text: `${pendingReviews} assignment submission${pendingReviews === 1 ? '' : 's'} need review.`,
            tone: 'attention',
          }
        : {
            id: 'reviews',
            text: 'No pending assignment reviews.',
            tone: 'success',
          },
      {
        id: 'completion',
        text: `Average assignment completion is ${avgCompletion}% across active classes.`,
        tone: avgCompletion >= 75 ? 'success' : 'info',
      },
      {
        id: 'focus',
        text: 'Post one follow-up action after each lesson to keep momentum.',
        tone: 'info',
      },
    ];
  } else {
    const [{ data: classMembers }, { data: insight }] = await Promise.all([
      admin.from('class_members').select('class_id').eq('user_id', userId).eq('member_role', 'student'),
      admin.from('student_insights').select('progress, homework_completion, needs_attention, note').eq('user_id', userId).maybeSingle(),
    ]);

    const classIds = (classMembers || []).map((row) => row.class_id as string);
    let upcomingLessons = 0;
    if (classIds.length > 0) {
      const { data: lessons } = await admin
        .from('lessons')
        .select('scheduled_at')
        .in('class_id', classIds)
        .gte('scheduled_at', new Date().toISOString())
        .range(0, 99);
      upcomingLessons = (lessons || []).length;
    }

    const progress = toNumber(insight?.progress);
    const homeworkCompletion = toNumber(insight?.homework_completion);
    const needsAttention = Boolean(insight?.needs_attention);

    insights = [
      {
        id: 'progress',
        text: `Your current progress is ${progress}% across active classes.`,
        tone: progress >= 70 ? 'success' : 'info',
      },
      {
        id: 'homework',
        text: `Homework completion is ${homeworkCompletion}%.`,
        tone: homeworkCompletion >= 75 ? 'success' : 'attention',
      },
      upcomingLessons > 0
        ? {
            id: 'lessons',
            text: `${upcomingLessons} upcoming lesson${upcomingLessons === 1 ? '' : 's'} are on your schedule.`,
            tone: 'info',
          }
        : {
            id: 'lessons',
            text: 'No upcoming lessons are scheduled yet.',
            tone: 'attention',
          },
      needsAttention
        ? {
            id: 'support',
            text: 'You are flagged for follow-up support. Review recent class messages.',
            tone: 'attention',
          }
        : {
            id: 'support',
            text: 'You are on track. Keep your lesson recap routine consistent.',
            tone: 'success',
          },
      asText(insight?.note)
        ? {
            id: 'note',
            text: asText(insight?.note),
            tone: 'info',
          }
        : {
            id: 'note',
            text: 'Add a quick reflection after each lesson to improve retention.',
            tone: 'info',
          },
    ];
  }

  return json(200, {
    mode: 'rule_based',
    provider: 'skillstream_rules_v1',
    generatedAt: new Date().toISOString(),
    insights,
  });
});
