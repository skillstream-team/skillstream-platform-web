export interface SWSessionConfig {
  roomName: string;
  roomToken: string;
  isModerator: boolean;
  userName: string;
  teacherUserId: string | null;
}

export interface SWParticipant {
  id: string;
  name: string;
  isLocal: boolean;
  audioMuted: boolean;
  videoMuted: boolean;
}

export const roomNameFromLessonId = (lessonId: string): string =>
  `skillstream-${lessonId.replace(/-/g, '').slice(0, 24)}`;
