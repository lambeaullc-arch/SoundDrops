import { useState, useEffect, useRef, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';

const MiniWaveformPlayer = ({ audioUrl, packId, isGlobalPlaying, onPlay, onStop }) => {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (waveformRef.current && audioUrl) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'rgba(139, 92, 246, 0.4)',
        progressColor: '#8B5CF6',
        cursorColor: '#fff',
        barWidth: 2,
        barRadius: 2,
        barGap: 1,
        responsive: true,
        height: 40,
        normalize: true,
        backend: 'WebAudio',
        cursorWidth: 2,
        interact: true
      });

      wavesurfer.current.load(audioUrl);

      wavesurfer.current.on('ready', () => {
        setIsLoading(false);
        const dur = wavesurfer.current.getDuration();
        setDuration(formatTime(dur));
      });

      wavesurfer.current.on('audioprocess', () => {
        const cur = wavesurfer.current.getCurrentTime();
        setCurrentTime(formatTime(cur));
      });

      wavesurfer.current.on('play', () => {
        setIsPlaying(true);
        if (onPlay) onPlay(packId);
      });

      wavesurfer.current.on('pause', () => {
        setIsPlaying(false);
      });

      wavesurfer.current.on('finish', () => {
        setIsPlaying(false);
        if (onStop) onStop(packId);
      });

      wavesurfer.current.on('error', () => {
        setIsLoading(false);
      });
    }

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, [audioUrl, formatTime, onPlay, onStop, packId]);

  // Stop if another player starts
  useEffect(() => {
    if (isGlobalPlaying && isGlobalPlaying !== packId && wavesurfer.current && isPlaying) {
      wavesurfer.current.pause();
    }
  }, [isGlobalPlaying, packId, isPlaying]);

  const togglePlay = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  return (
    <div className="glass-panel p-3 rounded-lg" data-testid={`mini-waveform-${packId}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition flex-shrink-0 ${
            isLoading 
              ? 'bg-gray-500/50 cursor-wait' 
              : 'bg-gradient-to-br from-violet-500 to-purple-600 hover:scale-110'
          }`}
          data-testid="mini-play-btn"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : isPlaying ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div 
            ref={waveformRef} 
            className="w-full cursor-pointer"
            style={{ minHeight: '40px' }}
          ></div>
          <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
            <span>{currentTime}</span>
            <span>{duration}</span>
          </div>
        </div>
      </div>
      
      {isPlaying && (
        <div className="flex items-center gap-2 mt-2 text-xs text-green-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Playing - Click waveform to seek</span>
        </div>
      )}
    </div>
  );
};

export default MiniWaveformPlayer;
