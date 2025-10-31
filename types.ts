export enum AppState {
  WELCOME,
  DETECTING_FACE,
  CONVERSING,
  VIEWING_HISTORY,
}

export interface TranscriptMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
}

export interface StoredTranscript {
  date: string;
  messages: TranscriptMessage[];
}