import { create } from 'zustand';

type ClassTab = 'students' | 'lessons' | 'homework' | 'resources' | 'progress' | 'messages';

interface SessionUiState {
  classTabById: Record<string, ClassTab>;
  studentsSearchQuery: string;
  messagesSearchQuery: string;
  messageDraftByClassId: Record<string, string>;
  globalMessageDraft: string;
  scheduleSelectedClassId: string;
  typingByScope: Record<string, boolean>;
}

interface SessionUiActions {
  setClassTab: (classId: string, tab: ClassTab) => void;
  setStudentsSearchQuery: (query: string) => void;
  setMessagesSearchQuery: (query: string) => void;
  setMessageDraft: (scope: string, value: string) => void;
  setScheduleSelectedClassId: (classId: string) => void;
  setTyping: (scope: string, isTyping: boolean) => void;
  clearTyping: (scope: string) => void;
}

type SessionUiStore = SessionUiState & SessionUiActions;

export const useSessionUiStore = create<SessionUiStore>((set) => ({
  classTabById: {},
  studentsSearchQuery: '',
  messagesSearchQuery: '',
  messageDraftByClassId: {},
  globalMessageDraft: '',
  scheduleSelectedClassId: '',
  typingByScope: {},

  setClassTab: (classId, tab) =>
    set((state) => ({
      classTabById: {
        ...state.classTabById,
        [classId]: tab,
      },
    })),

  setStudentsSearchQuery: (query) => set({ studentsSearchQuery: query }),
  setMessagesSearchQuery: (query) => set({ messagesSearchQuery: query }),

  setMessageDraft: (scope, value) =>
    set((state) => {
      if (scope === 'global') {
        return { globalMessageDraft: value };
      }
      return {
        messageDraftByClassId: {
          ...state.messageDraftByClassId,
          [scope]: value,
        },
      };
    }),

  setScheduleSelectedClassId: (classId) => set({ scheduleSelectedClassId: classId }),

  setTyping: (scope, isTyping) =>
    set((state) => ({
      typingByScope: {
        ...state.typingByScope,
        [scope]: isTyping,
      },
    })),

  clearTyping: (scope) =>
    set((state) => {
      const next = { ...state.typingByScope };
      delete next[scope];
      return { typingByScope: next };
    }),
}));
