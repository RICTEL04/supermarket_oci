'use client'
import { useEffect, useRef, useState } from 'react';
import { Camera, X, Mic, MicOff } from 'lucide-react';

interface CameraViewProps {
  isOpen: boolean;
  onClose: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  onMicToggle: () => void;
}

export function CameraView({ isOpen, onClose, isListening, isSpeaking, onMicToggle }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    // Cleanup al desmontar
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Solicitar acceso a la cámara - preferir cámara trasera en móviles
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // 'environment' = cámara trasera, 'user' = cámara frontal
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please check permissions.');
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] bg-black rounded-lg overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-lg"
          aria-label="Close camera"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Camera Title */}
        <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Camera Active</span>
          </div>
        </div>

        {/* Video Element */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-xl">Starting camera...</div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-500 text-white px-6 py-4 rounded-lg max-w-md text-center">
              {error}
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Instructions */}
        <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-4">
          {/* Microphone Button - Accessible even with camera open */}
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onMicToggle();
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              onMicToggle();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMicToggle();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMicToggle();
            }}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              WebkitTapHighlightColor: 'transparent',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              touchAction: 'manipulation'
            }}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl select-none active:scale-95 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            aria-label={isListening ? 'Release to stop listening' : 'Press and hold to speak'}
          >
            {isListening ? (
              <Mic className="w-16 h-16 text-white" />
            ) : (
              <MicOff className="w-16 h-16 text-white" />
            )}
          </button>

          {/* Status indicator */}
          <div className="bg-black bg-opacity-70 px-6 py-3 rounded-lg">
            <p className="text-white text-center font-semibold">
              {isSpeaking
                ? '🔊 Assistant is speaking...'
                : isListening
                ? '🎤 Listening...'
                : 'Press and hold mic, then say "Camera off" or "Turn off camera"'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
