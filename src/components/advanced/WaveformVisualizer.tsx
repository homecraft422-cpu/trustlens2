"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface WaveformVisualizerProps {
  audioUrl: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  height?: number;
  color?: string;
  progressColor?: string;
  showControls?: boolean;
}

export default function WaveformVisualizer({
  audioUrl,
  isPlaying,
  onPlayPause,
  height = 80,
  color = "#94a3b8",
  progressColor = "#4c6ef5",
  showControls = true,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate waveform data from audio
  useEffect(() => {
    const generateWaveform = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        setDuration(audioBuffer.duration);
        
        // Get channel data
        const channelData = audioBuffer.getChannelData(0);
        const samples = 200; // Number of bars
        const blockSize = Math.floor(channelData.length / samples);
        const waveform: number[] = [];
        
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[i * blockSize + j] || 0);
          }
          waveform.push(sum / blockSize);
        }
        
        // Normalize
        const max = Math.max(...waveform);
        const normalizedWaveform = waveform.map(v => v / max);
        setWaveformData(normalizedWaveform);
        setIsLoading(false);
      } catch (err) {
        console.error("Error generating waveform:", err);
        setIsLoading(false);
      }
    };

    if (audioUrl) {
      generateWaveform();
    }
  }, [audioUrl]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);

      const barWidth = rect.width / waveformData.length;
      const progressRatio = duration > 0 ? currentTime / duration : 0;
      const progressX = rect.width * progressRatio;

      waveformData.forEach((value, i) => {
        const x = i * barWidth;
        const barHeight = value * rect.height * 0.8;
        const y = (rect.height - barHeight) / 2;

        // Determine if bar is before or after progress
        const isBeforeProgress = x < progressX;

        ctx.fillStyle = isBeforeProgress ? progressColor : color;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      });

      // Draw progress line
      ctx.strokeStyle = progressColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, rect.height);
      ctx.stroke();
    };

    draw();
  }, [waveformData, currentTime, duration, color, progressColor]);

  // Handle audio playback
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.addEventListener("timeupdate", () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });
      audioRef.current.addEventListener("loadedmetadata", () => {
        setDuration(audioRef.current?.duration || 0);
      });
    }

    if (isPlaying) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isPlaying, audioUrl]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioRef.current || !duration) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const newTime = ratio * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="flex items-center justify-center h-20 bg-slate-100 rounded-xl">
          <div className="animate-pulse text-sm text-slate-500">
            Generating waveform...
          </div>
        </div>
      ) : (
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full rounded-xl cursor-pointer"
            style={{ height: `${height}px` }}
            onClick={handleCanvasClick}
          />
          
          {showControls && (
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-xs text-slate-500 font-mono">
                {formatTime(currentTime)}
              </span>
              <button
                onClick={onPlayPause}
                className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 transition-colors shadow-lg"
              >
                {isPlaying ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 ml-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <span className="text-xs text-slate-500 font-mono">
                {formatTime(duration)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
