import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TranscriptMessage } from '../types';
import { MicrophoneIcon, StopIcon, AiIcon, UserIcon } from './Icons';
import { connectToLiveSession } from '../services/geminiService';
import { saveTranscript } from '../utils/storage';

interface ConversationViewProps {
  onConversationEnd: () => void;
}

const ConversationView: React.FC<ConversationViewProps> = ({ onConversationEnd }) => {
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<any>(null); // Using `any` to avoid complex type from SDK
  const cleanupRef = useRef<() => void>();
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');
  
  // FIX: The onClick handler was passing an event to `handleEndConversation`. The function signature has been updated to accept the event, and it is now passed directly to `onClick`.
  const handleEndConversation = useCallback(() => {
    // Save transcript if it has more than just the initial greeting
    if (transcript.length > 1) {
      saveTranscript({
        date: new Date().toISOString(),
        messages: transcript,
      });
    }

    console.log("Cleaning up resources...");
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (cleanupRef.current) {
      cleanupRef.current();
    }
    onConversationEnd();
  }, [onConversationEnd, transcript]);

  useEffect(() => {
    const startConversation = async () => {
      try {
        const { sessionPromise, cleanup: sessionCleanup } = await connectToLiveSession({
          onConnect: () => {
            setIsConnecting(false);
            setIsListening(true);
            setTranscript([{id: Date.now(), sender: 'ai', text: 'Hello! How can I help you today?'}])
          },
          onMessage: (message, audioPlayer) => {
            if (message.serverContent?.modelTurn) setIsSpeaking(true);
            if(message.serverContent?.turnComplete) setIsSpeaking(false);
            
            if (message.serverContent?.outputTranscription?.text) {
                currentOutputTranscription.current += message.serverContent.outputTranscription.text;
            }
            if (message.serverContent?.inputTranscription?.text) {
                currentInputTranscription.current += message.serverContent.inputTranscription.text;
            }

            if(message.serverContent?.turnComplete) {
                const userInput = currentInputTranscription.current.trim();
                const aiResponse = currentOutputTranscription.current.trim();
                setTranscript(prev => {
                    const newTranscript = [...prev];
                    if (userInput) newTranscript.push({ id: Date.now() - 1, sender: 'user', text: userInput });
                    if (aiResponse) newTranscript.push({ id: Date.now(), sender: 'ai', text: aiResponse });
                    return newTranscript;
                });
                currentInputTranscription.current = '';
                currentOutputTranscription.current = '';
            }
            audioPlayer.play();
          },
          onError: (e) => {
            console.error('Session Error:', e);
            setError('A connection error occurred. Please try again.');
            setIsConnecting(false);
            setIsListening(false);
          },
          onClose: () => {
            console.log('Session Closed.');
            setIsListening(false);
          }
        });

        cleanupRef.current = sessionCleanup;
        sessionRef.current = await sessionPromise;

      } catch (err) {
        console.error("Failed to start conversation:", err);
        setError("Could not initialize microphone or AI session.");
        setIsConnecting(false);
      }
    };

    startConversation();
    
    return () => {
      if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
      }
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <div className="flex flex-col h-full p-4 md:p-6">
      <div className="flex-grow overflow-y-auto pr-2">
        <div className="space-y-6">
          {transcript.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender === 'ai' && <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0"><AiIcon className="w-6 h-6"/></div>}
              <div className={`p-4 rounded-2xl max-w-lg ${msg.sender === 'ai' ? 'bg-gray-700/80 rounded-tl-none' : 'bg-blue-600/90 rounded-tr-none text-white'}`}>
                <p>{msg.text}</p>
              </div>
              {msg.sender === 'user' && <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0"><UserIcon className="w-6 h-6"/></div>}
            </div>
          ))}
        </div>
        <div ref={transcriptEndRef} />
      </div>

      <div className="flex-shrink-0 pt-6 mt-4 border-t border-gray-700/50 flex flex-col items-center">
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <div className="flex items-center space-x-4 mb-4">
            {isListening ? (
                <div className="flex items-center text-green-400">
                    <MicrophoneIcon className="w-6 h-6 animate-pulse" />
                    <span className="ml-2 font-medium">Listening...</span>
                </div>
            ) : isConnecting ? (
                 <div className="flex items-center text-yellow-400">
                    <span className="ml-2 font-medium">Connecting...</span>
                </div>
            ) : (
                <div className="flex items-center text-gray-400">
                    <span className="ml-2 font-medium">Not Listening</span>
                </div>
            )}
             {isSpeaking && (
                <div className="flex items-center text-blue-400">
                    <AiIcon className="w-6 h-6 animate-pulse" />
                    <span className="ml-2 font-medium">AI Speaking...</span>
                </div>
            )}
        </div>
        <button
          onClick={handleEndConversation}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-all duration-300 flex items-center space-x-2"
        >
          <StopIcon className="w-6 h-6" />
          <span>End Conversation</span>
        </button>
      </div>
    </div>
  );
};

export default ConversationView;