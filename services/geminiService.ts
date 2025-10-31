
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAiBlob } from '@google/genai';
import { decode, decodeAudioData, encode } from '../utils/audio';

let ai: GoogleGenAI;
const getAi = () => {
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    }
    return ai;
}

interface ConnectCallbacks {
    onConnect: () => void;
    onMessage: (message: LiveServerMessage, audioPlayer: { play: () => void }) => void;
    onError: (e: any) => void;
    onClose: () => void;
}

export const connectToLiveSession = async (callbacks: ConnectCallbacks) => {
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    
    let nextStartTime = 0;
    const sources = new Set<AudioBufferSourceNode>();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const sessionPromise = getAi().live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => {
                callbacks.onConnect();
                const source = inputAudioContext.createMediaStreamSource(stream);
                const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                
                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const l = inputData.length;
                    const int16 = new Int16Array(l);
                    for (let i = 0; i < l; i++) {
                      // FIX: Per @google/genai guidelines, use a multiplier of 32768 for PCM audio encoding.
                      int16[i] = inputData[i] * 32768;
                    }
                    const pcmBlob: GenAiBlob = {
                      data: encode(new Uint8Array(int16.buffer)),
                      mimeType: 'audio/pcm;rate=16000',
                    };
                    sessionPromise.then((session) => {
                       session.sendRealtimeInput({ media: pcmBlob });
                    }).catch(callbacks.onError);
                };

                source.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
                const audioPlayer = { play: () => {} };
                const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;

                if (base64EncodedAudioString) {
                    audioPlayer.play = async () => {
                        nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), outputAudioContext, 24000, 1);
                        const source = outputAudioContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAudioContext.destination);
                        source.addEventListener('ended', () => {
                            sources.delete(source);
                        });
                        source.start(nextStartTime);
                        nextStartTime += audioBuffer.duration;
                        sources.add(source);
                    };
                }
                
                if (message.serverContent?.interrupted) {
                    for (const source of sources.values()) {
                        source.stop();
                        sources.delete(source);
                    }
                    nextStartTime = 0;
                }
                
                callbacks.onMessage(message, audioPlayer);
            },
            onerror: callbacks.onError,
            onclose: callbacks.onClose,
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            systemInstruction: 'You are a friendly and professional AI receptionist named Eva. Greet the guest warmly and ask how you can help them. Listen for the user\'s language and respond in the same language for the entire conversation. Adapt your language and tone to match the user\'s speaking style. If the user is formal, be formal. If the user is casual and uses slang, be casual and use similar slang. Mirror their energy and vocabulary while remaining helpful and professional. Keep your responses concise.',
            inputAudioTranscription: {},
            outputAudioTranscription: {}
        },
    });

    const cleanup = () => {
        stream.getTracks().forEach(track => track.stop());
        if (inputAudioContext.state !== 'closed') {
            inputAudioContext.close();
        }
        if (outputAudioContext.state !== 'closed') {
            outputAudioContext.close();
        }
    };

    return { sessionPromise, cleanup };
};