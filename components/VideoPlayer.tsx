'use client'
import { useState, useCallback } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { videoService } from '@/lib/videoService';

interface VideoPlayerProps {
  playbackId: string;
  title: string;
  className?: string;
  onProgress?: (progress: number) => void;  
  onComplete?: () => void;                 
}

export default function VideoPlayer({ 
  playbackId, 
  title, 
  className = '',
  onProgress,
  onComplete 
}: VideoPlayerProps) {
  const [playerState, setPlayerState] = useState<'loading' | 'ready' | 'error' | 'retrying'>('loading');
  const [error, setError] = useState<string>('');

  const handlePlayerReady = useCallback(() => {
    setPlayerState('ready');
    setError('');
  }, []);

  const handlePlayerError = useCallback((error: any) => {
    console.warn('Player error:', error);
    setPlayerState('error');
    setError('Failed to load video. Please check your connection.');
  }, []);

  const handleRetry = useCallback(() => {
    setPlayerState('retrying');
    setError('');
    
    videoService.initializePlayer({
      playbackId,
      onReady: handlePlayerReady,
      onError: handlePlayerError,
      onRetry: handleRetry,
    });
  }, [playbackId, handlePlayerReady, handlePlayerError]);

  // Initialize video service
  useState(() => {
    videoService.initializePlayer({
      playbackId,
      onReady: handlePlayerReady,
      onError: handlePlayerError,
      onRetry: handleRetry,
    });
  });

  return (
    <div className={`relative ${className}`}>
      {/* Loading State */}
      {playerState === 'loading' && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {playerState === 'error' && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
          <div className="text-white text-center">
            <p className="text-red-300 mb-4">{error}</p>
            <button 
              onClick={handleRetry}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Retry Video
            </button>
          </div>
        </div>
      )}

      {/* Retrying State */}
      {playerState === 'retrying' && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>Reconnecting...</p>
          </div>
        </div>
      )}

      {/* Mux Player */}
      <MuxPlayer
        playbackId={playbackId}
        streamType="on-demand"
        className={`w-full h-full ${playerState !== 'ready' ? 'opacity-0' : 'opacity-100'}`}
        accentColor="#3B82F6"
        primaryColor="#ffffff"
        secondaryColor="#000000"
        onPlaying={handlePlayerReady}
        onError={handlePlayerError}
      />
    </div>
  );
}





