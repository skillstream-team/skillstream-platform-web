import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Video, 
  Clock, 
  Users, 
  Plus,
  BookOpen,
  TrendingUp,
  ArrowRight,
  DollarSign,
  GraduationCap
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { getPersonalCalendar, getTeacherStats, getEarningsReport } from '../services/api';
import { CalendarEvent } from '../types';

interface UpcomingLesson {
  id: string;
  title: string;
  teacherName: string;
  scheduledAt: string;
  duration: number;
  studentCount: number;
  type: 'live' | 'recorded';
  joinLink?: string;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isTeacher = user?.role === 'TEACHER';
  
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState({
    totalLessons: 0,
    totalStudents: 0,
    upcomingToday: 0,
    earnings: 0,
    enrollments: 0,
    completionRate: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load calendar events and deadlines
      try {
        const personal = await getPersonalCalendar();
        const events = personal.events || [];
        setUpcomingEvents(events.slice(0, 5));
        
        // Filter deadlines (assignments, quizzes with due dates)
        const deadlines = events.filter(e => {
          return (e.type === 'assignment' || e.type === 'quiz') && 
            e.endTime && 
            new Date(e.endTime) > new Date();
        }).sort((a, b) => {
          const dateA = new Date(a.endTime || '').getTime();
          const dateB = new Date(b.endTime || '').getTime();
          return dateA - dateB;
        }).slice(0, 5);
        setUpcomingDeadlines(deadlines);
      } catch (err) {
        console.error('Error loading calendar events:', err);
        setUpcomingEvents([]);
        setUpcomingDeadlines([]);
      }
      
      // Load teacher stats
      if (isTeacher && user?.id) {
        try {
          const [teacherStats, earnings] = await Promise.all([
            getTeacherStats(user.id),
            getEarningsReport(user.id).catch(() => ({ totalRevenue: 0, monthlyRevenue: 0 }))
          ]);
          
          setStats({
            totalLessons: teacherStats.totalLessons || 0,
            totalStudents: teacherStats.totalStudents || 0,
            upcomingToday: upcomingEvents.filter(e => {
              const eventDate = new Date(e.startTime || '');
              const today = new Date();
              return eventDate.toDateString() === today.toDateString();
            }).length,
            earnings: earnings.totalRevenue || 0,
            enrollments: teacherStats.totalStudents || 0,
            completionRate: teacherStats.averageCompletionRate || 0,
            revenue: earnings.monthlyRevenue || 0
          });
        } catch (err) {
          console.error('Error loading teacher stats:', err);
          setStats({
            totalLessons: 0,
            totalStudents: 0,
            upcomingToday: 0,
            earnings: 0,
            enrollments: 0,
            completionRate: 0,
            revenue: 0
          });
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setUpcomingLessons([]);
      setUpcomingEvents([]);
      setUpcomingDeadlines([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getNextLesson = () => {
    return upcomingLessons.length > 0 ? upcomingLessons[0] : null;
  };

  const nextLesson = getNextLesson();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Welcome Header with Glassmorphism */}
      <div className="dashboard-welcome">
        <div className="dashboard-welcome-content">
          <div className="dashboard-welcome-text">
            <h1 className="dashboard-welcome-title">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="dashboard-welcome-subtitle">
              {isTeacher 
                ? 'Ready to inspire your students today?' 
                : 'Continue your learning journey'}
            </p>
          </div>
          <div className="dashboard-welcome-icon">
            {isTeacher ? (
              <GraduationCap />
            ) : (
              <BookOpen />
            )}
          </div>
        </div>
      </div>

      {/* Hero Section - Next Lesson */}
      {nextLesson && (
        <div className="dashboard-next-lesson">
          <div className="dashboard-next-lesson-content">
            <div className="dashboard-next-lesson-info">
              <div className="dashboard-next-lesson-header">
                <div className="dashboard-next-lesson-icon-wrapper">
                  <Clock className="dashboard-next-lesson-icon" />
                </div>
                <span className="dashboard-next-lesson-time">
                  {nextLesson.scheduledAt ? `Next lesson: ${formatTime(nextLesson.scheduledAt)}` : 'Upcoming Lesson'}
                </span>
              </div>
              <h2 className="dashboard-next-lesson-title">
                {nextLesson.title}
              </h2>
              <div className="dashboard-next-lesson-meta">
                {isTeacher ? (
                  <>
                    <div className="dashboard-next-lesson-meta-item">
                      <Users className="dashboard-next-lesson-meta-icon" />
                      <span>{nextLesson.studentCount} {nextLesson.studentCount === 1 ? 'student' : 'students'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="dashboard-next-lesson-meta-item">
                      <Users className="dashboard-next-lesson-meta-icon" />
                      <span>with {nextLesson.teacherName}</span>
                    </div>
                  </>
                )}
                <div className="dashboard-next-lesson-meta-item">
                  <Clock className="dashboard-next-lesson-meta-icon" />
                  <span>{nextLesson.duration} minutes</span>
                </div>
              </div>
            </div>
            <div className="dashboard-next-lesson-actions">
              {nextLesson.joinLink && (
                <button
                  onClick={() => window.open(nextLesson.joinLink, '_blank')}
                  className="dashboard-button-primary"
                >
                  <Video className="dashboard-button-primary-icon" />
                  <span>Join Now</span>
                </button>
              )}
              <Link to="/calendar" className="dashboard-button-secondary">
                View Calendar
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="dashboard-quick-actions">
        <h3 className="dashboard-quick-actions-title">
          Quick Actions
        </h3>
        <div className="dashboard-quick-actions-grid">
          {isTeacher ? (
            <>
              <button
                onClick={() => navigate('/lessons/create')}
                className="dashboard-quick-action-card dashboard-quick-action-card--teal"
              >
                <div className="dashboard-quick-action-header">
                  <div className="dashboard-quick-action-icon-wrapper dashboard-quick-action-icon-wrapper--teal">
                    <Plus className="dashboard-quick-action-icon dashboard-quick-action-icon--teal" />
                  </div>
                  <div className="dashboard-quick-action-text">
                    <h4 className="dashboard-quick-action-title">Create Lesson</h4>
                    <p className="dashboard-quick-action-subtitle">Start a new lesson</p>
                  </div>
                </div>
                <p className="dashboard-quick-action-description">
                  Set up an extra lesson in minutes
                </p>
              </button>

              <Link
                to="/lessons/availability"
                className="dashboard-quick-action-card dashboard-quick-action-card--purple"
              >
                <div className="dashboard-quick-action-header">
                  <div className="dashboard-quick-action-icon-wrapper dashboard-quick-action-icon-wrapper--purple">
                    <Calendar className="dashboard-quick-action-icon dashboard-quick-action-icon--purple" />
                  </div>
                  <div className="dashboard-quick-action-text">
                    <h4 className="dashboard-quick-action-title">Set Availability</h4>
                    <p className="dashboard-quick-action-subtitle">Manage your schedule</p>
                  </div>
                </div>
                <p className="dashboard-quick-action-description">
                  Let students book your time
                </p>
              </Link>

              <Link
                to="/analytics"
                className="dashboard-quick-action-card dashboard-quick-action-card--light-purple"
              >
                <div className="dashboard-quick-action-header">
                  <div className="dashboard-quick-action-icon-wrapper dashboard-quick-action-icon-wrapper--light-purple">
                    <TrendingUp className="dashboard-quick-action-icon dashboard-quick-action-icon--light-purple" />
                  </div>
                  <div className="dashboard-quick-action-text">
                    <h4 className="dashboard-quick-action-title">View Analytics</h4>
                    <p className="dashboard-quick-action-subtitle">Track performance</p>
                  </div>
                </div>
                <p className="dashboard-quick-action-description">
                  See your teaching stats
                </p>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/lessons/book"
                className="dashboard-quick-action-card dashboard-quick-action-card--teal"
              >
                <div className="dashboard-quick-action-header">
                  <div className="dashboard-quick-action-icon-wrapper dashboard-quick-action-icon-wrapper--teal">
                    <BookOpen className="dashboard-quick-action-icon dashboard-quick-action-icon--teal" />
                  </div>
                  <div className="dashboard-quick-action-text">
                    <h4 className="dashboard-quick-action-title">Book a Lesson</h4>
                    <p className="dashboard-quick-action-subtitle">Find available lessons</p>
                  </div>
                </div>
                <p className="dashboard-quick-action-description">
                  Browse teachers and book slots
                </p>
              </Link>

              <Link
                to="/courses"
                className="dashboard-quick-action-card dashboard-quick-action-card--purple"
              >
                <div className="dashboard-quick-action-header">
                  <div className="dashboard-quick-action-icon-wrapper dashboard-quick-action-icon-wrapper--purple">
                    <Video className="dashboard-quick-action-icon dashboard-quick-action-icon--purple" />
                  </div>
                  <div className="dashboard-quick-action-text">
                    <h4 className="dashboard-quick-action-title">My Lessons</h4>
                    <p className="dashboard-quick-action-subtitle">View enrolled lessons</p>
                  </div>
                </div>
                <p className="dashboard-quick-action-description">
                  Access your learning materials
                </p>
              </Link>

              <Link
                to="/calendar"
                className="dashboard-quick-action-card dashboard-quick-action-card--light-purple"
              >
                <div className="dashboard-quick-action-header">
                  <div className="dashboard-quick-action-icon-wrapper dashboard-quick-action-icon-wrapper--light-purple">
                    <Calendar className="dashboard-quick-action-icon dashboard-quick-action-icon--light-purple" />
                  </div>
                  <div className="dashboard-quick-action-text">
                    <h4 className="dashboard-quick-action-title">My Schedule</h4>
                    <p className="dashboard-quick-action-subtitle">View calendar</p>
                  </div>
                </div>
                <p className="dashboard-quick-action-description">
                  See all your lessons
                </p>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {isTeacher && (
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <span className="dashboard-stat-label">Total Lessons</span>
              <div className="dashboard-stat-icon-wrapper dashboard-stat-icon-wrapper--teal">
                <Video className="dashboard-stat-icon dashboard-stat-icon--teal" />
              </div>
            </div>
            <p className="dashboard-stat-value">{stats.totalLessons}</p>
          </div>
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <span className="dashboard-stat-label">Total Students</span>
              <div className="dashboard-stat-icon-wrapper dashboard-stat-icon-wrapper--purple">
                <Users className="dashboard-stat-icon dashboard-stat-icon--purple" />
              </div>
            </div>
            <p className="dashboard-stat-value">{stats.totalStudents}</p>
          </div>
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <span className="dashboard-stat-label">Today's Lessons</span>
              <div className="dashboard-stat-icon-wrapper dashboard-stat-icon-wrapper--light-purple">
                <Clock className="dashboard-stat-icon dashboard-stat-icon--light-purple" />
              </div>
            </div>
            <p className="dashboard-stat-value">{stats.upcomingToday}</p>
          </div>
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <span className="dashboard-stat-label">Enrollments</span>
              <div className="dashboard-stat-icon-wrapper dashboard-stat-icon-wrapper--purple">
                <Users className="dashboard-stat-icon dashboard-stat-icon--purple" />
              </div>
            </div>
            <p className="dashboard-stat-value">{stats.enrollments}</p>
          </div>
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <span className="dashboard-stat-label">Completion Rate</span>
              <div className="dashboard-stat-icon-wrapper dashboard-stat-icon-wrapper--teal">
                <TrendingUp className="dashboard-stat-icon dashboard-stat-icon--teal" />
              </div>
            </div>
            <p className="dashboard-stat-value">{Math.round(stats.completionRate)}%</p>
          </div>
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <span className="dashboard-stat-label">Monthly Revenue</span>
              <div className="dashboard-stat-icon-wrapper dashboard-stat-icon-wrapper--teal">
                <DollarSign className="dashboard-stat-icon dashboard-stat-icon--teal" />
              </div>
            </div>
            <p className="dashboard-stat-value">${stats.revenue.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Upcoming Events & Deadlines */}
      {(upcomingEvents.length > 0 || upcomingDeadlines.length > 0) && (
        <div className="dashboard-events-section">
          {upcomingEvents.length > 0 && (
            <div className="dashboard-events-card">
              <div className="dashboard-events-header">
                <h3 className="dashboard-events-title">Upcoming Events</h3>
                <Link to="/calendar" className="dashboard-events-link">
                  <span>View All</span>
                  <ArrowRight className="dashboard-events-link-icon" />
                </Link>
              </div>
              <div className="dashboard-events-list">
                {upcomingEvents.slice(0, 5).map((event) => (
                  <div 
                    key={event.id} 
                    className="dashboard-event-item"
                    onClick={() => navigate('/calendar')}
                  >
                    <div className="dashboard-event-icon-wrapper">
                      <Calendar className="dashboard-event-icon" />
                    </div>
                    <div className="dashboard-event-content">
                      <h4 className="dashboard-event-title">{event.title}</h4>
                      <p className="dashboard-event-meta">
                        {event.startTime && formatTime(event.startTime)}
                        {event.endTime && ` - ${formatTime(event.endTime)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {upcomingDeadlines.length > 0 && (
            <div className="dashboard-events-card">
              <div className="dashboard-events-header">
                <h3 className="dashboard-events-title">Upcoming Deadlines</h3>
                <Link to="/calendar" className="dashboard-events-link">
                  <span>View All</span>
                  <ArrowRight className="dashboard-events-link-icon" />
                </Link>
              </div>
              <div className="dashboard-events-list">
                {upcomingDeadlines.slice(0, 5).map((deadline) => {
                  const dueDate = new Date(deadline.endTime || '');
                  const daysUntil = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div 
                      key={deadline.id} 
                      className="dashboard-event-item dashboard-event-item--deadline"
                      onClick={() => {
                        if (deadline.type === 'assignment') {
                          navigate(`/assignments/${deadline.id}`);
                        } else if (deadline.type === 'quiz') {
                          navigate(`/quiz/${deadline.id}`);
                        } else {
                          navigate('/calendar');
                        }
                      }}
                    >
                      <div className={`dashboard-event-icon-wrapper dashboard-event-icon-wrapper--${daysUntil <= 3 ? 'urgent' : 'normal'}`}>
                        <Clock className="dashboard-event-icon" />
                      </div>
                      <div className="dashboard-event-content">
                        <h4 className="dashboard-event-title">{deadline.title}</h4>
                        <p className="dashboard-event-meta">
                          Due: {dueDate.toLocaleDateString()} ({daysUntil} {daysUntil === 1 ? 'day' : 'days'} left)
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upcoming Lessons */}
      <div className="dashboard-upcoming">
        <div className="dashboard-upcoming-header">
          <h3 className="dashboard-upcoming-title">
            {isTeacher ? 'Upcoming Lessons' : 'My Upcoming Lessons'}
          </h3>
          <Link to="/calendar" className="dashboard-upcoming-link">
            <span>View All</span>
            <ArrowRight className="dashboard-upcoming-link-icon" />
          </Link>
        </div>
        {upcomingLessons.length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="dashboard-empty-state-icon-wrapper">
              <Calendar className="dashboard-empty-state-icon" />
            </div>
            <h4 className="dashboard-empty-state-title">
              No upcoming lessons
            </h4>
            <p className="dashboard-empty-state-text">
              {isTeacher 
                ? 'Create your first lesson to get started'
                : 'Book a lesson to start learning'
              }
            </p>
            {isTeacher ? (
              <button
                onClick={() => navigate('/lessons/create')}
                className="dashboard-empty-state-button"
              >
                Create Lesson
              </button>
            ) : (
              <Link to="/lessons/book" className="dashboard-empty-state-button">
                Book a Lesson
              </Link>
            )}
          </div>
        ) : (
          <div className="dashboard-lessons-list">
            {upcomingLessons.map((lesson) => (
              <div key={lesson.id} className="dashboard-lesson-card">
                <div className="dashboard-lesson-content">
                  <div className="dashboard-lesson-info">
                    <div className="dashboard-lesson-header">
                      <h4 className="dashboard-lesson-title">
                        {lesson.title}
                      </h4>
                      {lesson.type === 'live' && (
                        <span className="dashboard-lesson-badge">
                          Live
                        </span>
                      )}
                    </div>
                    <div className="dashboard-lesson-meta">
                      <div className="dashboard-lesson-meta-item">
                        <Clock className="dashboard-lesson-meta-icon" />
                        <span>{formatTime(lesson.scheduledAt)} • {lesson.duration} min</span>
                      </div>
                      {isTeacher ? (
                        <div className="dashboard-lesson-meta-item">
                          <Users className="dashboard-lesson-meta-icon" />
                          <span>{lesson.studentCount} {lesson.studentCount === 1 ? 'student' : 'students'}</span>
                        </div>
                      ) : (
                        <span>with {lesson.teacherName}</span>
                      )}
                    </div>
                  </div>
                  <div className="dashboard-lesson-actions">
                    {lesson.joinLink && (
                      <button
                        onClick={() => window.open(lesson.joinLink, '_blank')}
                        className="dashboard-button-small dashboard-button-small-primary"
                      >
                        <Video className="dashboard-button-small-icon" />
                        <span>Join</span>
                      </button>
                    )}
                    <Link
                      to={`/lessons/${lesson.id}`}
                      className="dashboard-button-small dashboard-button-small-secondary"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
