
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFaceApi } from '../hooks/useFaceApi';
import { LoadingIcon, FaceIcon } from './Icons';

interface FaceDetectorProps {
  onFaceDetected: () => void;
}

const FaceDetector: React.FC<FaceDetectorProps> = ({ onFaceDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { modelsLoaded, error: modelError } = useFaceApi();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<'IDLE' | 'SCANNING' | 'WAITING' | 'DETECTED'>('IDLE');

  const startVideo = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setDetectionStatus('IDLE');
    }
  }, []);
  
  useEffect(() => {
    if (modelsLoaded) {
      startVideo();
    }
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelsLoaded, startVideo]);

  useEffect(() => {
    let intervalId: number | undefined;
    let timeoutId: number | undefined;

    const detectFace = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || !modelsLoaded) {
        return;
      }
      
      const detections = await (window as any).faceapi.detectAllFaces(
        videoRef.current,
        new (window as any).faceapi.TinyFaceDetectorOptions()
      );

      if (detections.length > 0) {
        setDetectionStatus('DETECTED');
        if (intervalId) clearInterval(intervalId);
        if (timeoutId) clearTimeout(timeoutId);
        setTimeout(() => {
            onFaceDetected();
        }, 1000); // Wait a second after detection to transition
      }
    };

    if (stream && modelsLoaded && detectionStatus !== 'DETECTED') {
      setDetectionStatus('SCANNING');
      timeoutId = window.setTimeout(() => {
        setDetectionStatus(currentStatus => currentStatus === 'SCANNING' ? 'WAITING' : currentStatus);
      }, 10000); // 10 seconds timeout

      intervalId = window.setInterval(detectFace, 500); // Check for face every 500ms
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [stream, modelsLoaded, onFaceDetected]);

  if (modelError) {
    return <div className="text-red-500 text-center p-4">Error loading face detection models.</div>;
  }

  if (!modelsLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <LoadingIcon className="w-16 h-16 animate-spin text-blue-400" />
        <p className="mt-4 text-lg">Initializing AI models...</p>
      </div>
    );
  }

  const statusMessage = {
    IDLE: "Please look at the camera.",
    SCANNING: "Scanning for face...",
    WAITING: "Ready when you are. Please step in front of the camera.",
    DETECTED: "Face Detected! Welcome."
  }[detectionStatus];

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="relative w-80 h-80 md:w-96 md:h-96">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full rounded-full object-cover transform -scale-x-100"
        ></video>
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
        <div className={`absolute inset-0 rounded-full border-4 transition-all duration-500 ${detectionStatus === 'DETECTED' ? 'border-green-400 shadow-[0_0_30px] shadow-green-400/50' : 'border-blue-500'}`}></div>
      </div>
      <div className="mt-8 text-center">
        <div className="flex items-center justify-center space-x-3 text-2xl">
          <FaceIcon className={`w-8 h-8 transition-colors ${detectionStatus === 'DETECTED' ? 'text-green-400' : 'text-blue-400'}`}/>
          <p className="font-medium">
            {statusMessage}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FaceDetector;