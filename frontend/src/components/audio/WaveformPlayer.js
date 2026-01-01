import { useState, useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

const WaveformPlayer = ({ audioUrl, packTitle }) => {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState('0:00');
  const [currentTime, setCurrentTime] = useState('0:00');

  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'rgba(139, 92, 246, 0.3)',
        progressColor: '#8B5CF6',
        cursorColor: '#fff',
        barWidth: 3,
        barRadius: 3,
        responsive: true,
        height: 80,
        normalize: true,
        backend: 'WebAudio'
      });

      wavesurfer.current.load(audioUrl);

      wavesurfer.current.on('ready', () => {
        const dur = wavesurfer.current.getDuration();
        setDuration(formatTime(dur));
      });

      wavesurfer.current.on('audioprocess', () => {
        const cur = wavesurfer.current.getCurrentTime();
        setCurrentTime(formatTime(cur));
      });

      wavesurfer.current.on('play', () => setIsPlaying(true));
      wavesurfer.current.on('pause', () => setIsPlaying(false));
    }

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, [audioUrl]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  return (
    <div className="glass-panel p-4" data-testid="waveform-player">
      <div className="flex items-center space-x-4 mb-2">
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center hover:scale-110 transition"
          data-testid="play-pause-button"
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{packTitle}</h4>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{currentTime}</span>
            <span>{duration}</span>
          </div>
        </div>
      </div>
      <div ref={waveformRef} className="w-full"></div>
    </div>
  );
};

export default WaveformPlayer;