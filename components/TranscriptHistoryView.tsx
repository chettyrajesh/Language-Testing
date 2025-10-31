import React, { useState, useEffect } from 'react';
import { StoredTranscript } from '../types';
import { getStoredTranscripts, clearStoredTranscripts } from '../utils/storage';
// FIX: Import the missing HistoryIcon component.
import { BackIcon, AiIcon, UserIcon, TrashIcon, HistoryIcon } from './Icons';

interface TranscriptHistoryViewProps {
  onBack: () => void;
}

const TranscriptHistoryView: React.FC<TranscriptHistoryViewProps> = ({ onBack }) => {
  const [transcripts, setTranscripts] = useState<StoredTranscript[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<StoredTranscript | null>(null);

  useEffect(() => {
    setTranscripts(getStoredTranscripts());
  }, []);

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to delete all conversation history? This cannot be undone.")) {
      clearStoredTranscripts();
      setTranscripts([]);
      setSelectedTranscript(null);
    }
  };

  if (selectedTranscript) {
    // View for a single transcript
    return (
      <div className="flex flex-col h-full p-4 md:p-6">
        <div className="flex-shrink-0 flex items-center justify-between pb-4 border-b border-gray-700/50">
          <button onClick={() => setSelectedTranscript(null)} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
            <BackIcon className="w-6 h-6"/>
            <span className="font-semibold">Back to History</span>
          </button>
          <h2 className="text-xl font-semibold text-gray-300">
            {new Date(selectedTranscript.date).toLocaleString()}
          </h2>
        </div>
        <div className="flex-grow overflow-y-auto pr-2 mt-4">
            <div className="space-y-6">
                {selectedTranscript.messages.map((msg) => (
                   <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                    {msg.sender === 'ai' && <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0"><AiIcon className="w-6 h-6"/></div>}
                    <div className={`p-4 rounded-2xl max-w-lg ${msg.sender === 'ai' ? 'bg-gray-700/80 rounded-tl-none' : 'bg-blue-600/90 rounded-tr-none text-white'}`}>
                        <p>{msg.text}</p>
                    </div>
                    {msg.sender === 'user' && <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0"><UserIcon className="w-6 h-6"/></div>}
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
  }

  // Main history list view
  return (
    <div className="flex flex-col h-full p-4 md:p-6">
      <div className="flex-shrink-0 flex items-center justify-between pb-4 border-b border-gray-700/50">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
          <BackIcon className="w-6 h-6"/>
          <span className="font-semibold">Back to Welcome</span>
        </button>
        <h1 className="text-2xl font-bold">Conversation History</h1>
        {transcripts.length > 0 ? (
          <button onClick={handleClearHistory} className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors">
            <TrashIcon className="w-5 h-5"/>
            <span>Clear All</span>
          </button>
        ) : <div className="w-24"></div> }
      </div>
      <div className="flex-grow overflow-y-auto mt-4">
        {transcripts.length === 0 ? (
          <div className="text-center text-gray-400 mt-20 flex flex-col items-center">
            <HistoryIcon className="w-16 h-16 mb-4 text-gray-600" />
            <p className="text-lg font-semibold">No past conversations found.</p>
            <p>Complete a conversation with the AI to see it here.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {transcripts.map((transcript) => (
              <li key={transcript.date}>
                <button
                  onClick={() => setSelectedTranscript(transcript)}
                  className="w-full text-left p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/70 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <p className="font-semibold text-lg text-white">
                    Conversation from {new Date(transcript.date).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400 mt-1 truncate">
                    {transcript.messages.length -1} exchange(s)
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TranscriptHistoryView;