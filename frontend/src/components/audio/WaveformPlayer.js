import { useState, useEffect, useRef, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';

const WaveformPlayer = ({ audioUrl, packTitle }) => {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState('0:00');
  const [currentTime, setCurrentTime] = useState('0:00');

  const formatTime = useCallback((seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (!waveformRef.current || !audioUrl) return;

    // Cleanup any existing instance
    if (wavesurfer.current) {
      wavesurfer.current.destroy();
      wavesurfer.current = null;
    }

    setIsLoading(true);
    setError(null);
    setIsReady(false);

    try {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'rgba(139, 92, 246, 0.4)',
        progressColor: '#8B5CF6',
        cursorColor: '#ffffff',
        cursorWidth: 2,
        barWidth: 3,
        barRadius: 3,
        barGap: 2,
        responsive: true,
        height: 80,
        normalize: true,
        backend: 'WebAudio',
        interact: true
      });

      wavesurfer.current.on('ready', () => {
        setIsLoading(false);
        setIsReady(true);
        const dur = wavesurfer.current.getDuration();
        setDuration(formatTime(dur));
      });

      wavesurfer.current.on('audioprocess', () => {
        if (wavesurfer.current) {
          const cur = wavesurfer.current.getCurrentTime();
          setCurrentTime(formatTime(cur));
        }
      });

      wavesurfer.current.on('seeking', () => {
        if (wavesurfer.current) {
          const cur = wavesurfer.current.getCurrentTime();
          setCurrentTime(formatTime(cur));
        }
      });

      wavesurfer.current.on('play', () => setIsPlaying(true));
      wavesurfer.current.on('pause', () => setIsPlaying(false));
      wavesurfer.current.on('finish', () => setIsPlaying(false));

      wavesurfer.current.on('error', (err) => {
        console.error('WaveSurfer error:', err);
        setError('Failed to load audio');
        setIsLoading(false);
      });

      wavesurfer.current.load(audioUrl);
    } catch (err) {
      console.error('WaveSurfer initialization error:', err);
      setError('Failed to initialize player');
      setIsLoading(false);
    }

    return () => {
      if (wavesurfer.current) {
        try {
          wavesurfer.current.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
        wavesurfer.current = null;
      }
    };
  }, [audioUrl, formatTime]);

  const togglePlay = () => {
    if (wavesurfer.current && isReady) {
      try {
        wavesurfer.current.playPause();
      } catch (err) {
        console.error('Play/pause error:', err);
      }
    }
  };

  if (error) {
    return (
      <div className="glass-panel p-4 text-center" data-testid="waveform-player">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4" data-testid="waveform-player">
      <div className="flex items-center space-x-4 mb-3">
        <button
          onClick={togglePlay}
          disabled={!isReady}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
            isReady 
              ? 'bg-gradient-to-br from-violet-500 to-purple-600 hover:scale-110 cursor-pointer' 
              : 'bg-gray-600 cursor-wait'
          }`}
          data-testid="play-pause-button"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : isPlaying ? (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
        <div className="flex-1">
          <h4 className="font-semibold text-sm truncate">{packTitle}</h4>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{currentTime}</span>
            <span>{duration}</span>
          </div>
        </div>
      </div>
      <div 
        ref={waveformRef} 
        className="w-full cursor-pointer"
        style={{ minHeight: '80px' }}
      ></div>
      {isReady && (
        <p className="text-xs text-gray-500 mt-2 text-center">Click on waveform to seek</p>
      )}
    </div>
  );
};

export default WaveformPlayer;