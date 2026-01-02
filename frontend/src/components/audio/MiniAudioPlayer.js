import { useState, useRef, useEffect } from 'react';

const MiniAudioPlayer = ({ audioUrl, packId, isGlobalPlaying, onPlay, onStop }) => {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      audio.currentTime = 0;
      if (onStop) onStop(packId);
    };

    const handleError = () => {
      setError('Failed to load');
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl, onStop, packId]);

  // Stop if another player starts
  useEffect(() => {
    const audio = audioRef.current;
    if (isGlobalPlaying && isGlobalPlaying !== packId && audio && isPlaying) {
      audio.pause();
      setIsPlaying(false);
    }
  }, [isGlobalPlaying, packId, isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(err => {
        console.error('Play error:', err);
        setError('Failed to play');
      });
      setIsPlaying(true);
      if (onPlay) onPlay(packId);
    }
  };

  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;

    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(percentage * 100);
  };

  if (error) {
    return (
      <div className="glass-panel p-3 rounded-lg text-center" data-testid={`mini-audio-${packId}`}>
        <p className="text-red-400 text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-3 rounded-lg" data-testid={`mini-audio-${packId}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition flex-shrink-0 ${
            isLoading 
              ? 'bg-gray-500/50 cursor-wait' 
              : 'bg-gradient-to-br from-violet-500 to-purple-600 hover:scale-110 cursor-pointer'
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
          {/* Progress Bar */}
          <div 
            ref={progressRef}
            onClick={handleProgressClick}
            className="h-8 bg-white/10 rounded cursor-pointer relative overflow-hidden"
            data-testid="mini-progress-bar"
          >
            {/* Mini waveform visualization */}
            <div className="absolute inset-0 flex items-center justify-center gap-[1px] px-1">
              {Array.from({ length: 40 }).map((_, i) => {
                const height = 30 + Math.sin(i * 0.4) * 20 + Math.random() * 15;
                const isActive = (i / 40) * 100 <= progress;
                return (
                  <div 
                    key={i}
                    className={`w-1 rounded-sm transition-colors ${isActive ? 'bg-violet-500' : 'bg-white/20'}`}
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
            
            {/* Progress overlay */}
            <div 
              className="absolute top-0 left-0 h-full bg-violet-500/20 pointer-events-none"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      
      {isPlaying && (
        <div className="flex items-center gap-2 mt-2 text-xs text-green-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Playing - Click bar to seek</span>
        </div>
      )}
    </div>
  );
};

export default MiniAudioPlayer;
