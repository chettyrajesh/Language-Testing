import React, { useState, useCallback } from 'react';
import { AppState } from './types';
import FaceDetector from './components/FaceDetector';
import ConversationView from './components/ConversationView';
import WelcomeScreen from './components/WelcomeScreen';
import TranscriptHistoryView from './components/TranscriptHistoryView';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);

  const handleFaceDetected = useCallback(() => {
    setAppState(AppState.CONVERSING);
  }, []);

  const handleConversationEnd = useCallback(() => {
    setAppState(AppState.WELCOME);
  }, []);

  const renderContent = () => {
    switch (appState) {
      case AppState.WELCOME:
        return <WelcomeScreen 
                  onStart={() => setAppState(AppState.DETECTING_FACE)} 
                  onViewHistory={() => setAppState(AppState.VIEWING_HISTORY)} 
                />;
      case AppState.DETECTING_FACE:
        return <FaceDetector onFaceDetected={handleFaceDetected} />;
      case AppState.CONVERSING:
        return <ConversationView onConversationEnd={handleConversationEnd} />;
      case AppState.VIEWING_HISTORY:
        return <TranscriptHistoryView onBack={() => setAppState(AppState.WELCOME)} />;
      default:
        return <WelcomeScreen 
                  onStart={() => setAppState(AppState.DETECTING_FACE)}
                  onViewHistory={() => setAppState(AppState.VIEWING_HISTORY)}
                />;
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-blue-900/50 font-sans p-4">
      <div className="w-full max-w-4xl h-[90vh] max-h-[800px] bg-black bg-opacity-30 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden flex flex-col">
        {renderContent()}
      </div>
    </main>
  );
};

export default App;