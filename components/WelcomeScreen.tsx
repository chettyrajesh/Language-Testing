import React from 'react';
import { HistoryIcon, RobotIcon } from './Icons';

interface WelcomeScreenProps {
  onStart: () => void;
  onViewHistory: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onViewHistory }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="mb-8 text-blue-400">
        <RobotIcon className="w-24 h-24" />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">AI Receptionist</h1>
      <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-xl">
        Hello! I'm here to assist you. Please stand in front of the camera to begin our conversation.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onStart}
          className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Start
        </button>
        <button
          onClick={onViewHistory}
          className="px-8 py-4 bg-gray-700 text-white font-semibold rounded-full hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-500/50 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
        >
          <HistoryIcon className="w-6 h-6" />
          View History
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;