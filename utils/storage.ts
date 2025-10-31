import { StoredTranscript } from '../types';

const TRANSCRIPT_KEY = 'ai-receptionist-transcripts';

export const getStoredTranscripts = (): StoredTranscript[] => {
  try {
    const item = window.localStorage.getItem(TRANSCRIPT_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error("Error reading transcripts from localStorage", error);
    return [];
  }
};

export const saveTranscript = (transcript: StoredTranscript) => {
  try {
    if (transcript.messages.length <= 1) return; // Don't save if only the greeting exists
    const transcripts = getStoredTranscripts();
    transcripts.unshift(transcript); // Add new one to the front
    window.localStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(transcripts));
  } catch (error) {
    console.error("Error saving transcript to localStorage", error);
  }
};

export const clearStoredTranscripts = () => {
    try {
        window.localStorage.removeItem(TRANSCRIPT_KEY);
    } catch (error) {
        console.error("Error clearing transcripts from localStorage", error);
    }
}