import { useState, useEffect } from 'react';

declare const faceapi: any;

export const useFaceApi = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';
      try {
        if (typeof faceapi === 'undefined') {
          throw new Error('face-api.js not loaded');
        }
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (e: any) {
        console.error('Error loading face-api models:', e);
        setError(e.message || 'Failed to load face detection models.');
      }
    };
    loadModels();
  }, []);

  return { modelsLoaded, error };
};
