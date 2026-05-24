export interface ChatMessage {
  id: string;
  uid: string;
  name: string;
  text: string;
  timestamp: number;
  isLocal: boolean;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  allowMultiple: boolean;
  createdAt: number;
}

// option index → array of voter display names
export type PollResults = Record<number, string[]>;

export interface RaisedHand {
  uid: string;
  name: string;
  raisedAt: number;
}

export interface BreakoutRoom {
  id: string;
  name: string;
  memberIds: string[];
}

export type SidePanelId = 'participants' | 'chat' | 'polls' | 'breakout';
