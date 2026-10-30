import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw } from 'lucide-react';
import { SubtitlePosition, SubtitleSegment, SubtitleTemplateId } from '../types';
import { SUBTITLE_TEMPLATES } from '../data/templates';

interface VideoPlayerPreviewProps {
  videoUrl: string;
  segments: SubtitleSegment[];
  templateId: SubtitleTemplateId;
  fontSize: number;
  position: SubtitlePosition;
  wordAnimation: boolean;
  syncOffset?: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onTimeUpdate?: (currentTime: number) => void;
  seekTime?: number | null;
}

export const VideoPlayerPreview: React.FC<VideoPlayerPreviewProps> = ({
  videoUrl,
  segments,
  templateId,
  fontSize,
  position,
  wordAnimation,
  syncOffset = 0,
  videoRef,
  onTimeUpdate,
  seekTime,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSegment, setActiveSegment] = useState<SubtitleSegment | null>(null);

  const currentTemplate = SUBTITLE_TEMPLATES.find((t) => t.id === templateId) || SUBTITLE_TEMPLATES[0];

  // Sync external seek command
  useEffect(() => {
    if (seekTime !== null && seekTime !== undefined && videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
      if (!isPlaying) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  }, [seekTime]);

  // High-precision 60fps subtitle synchronizer using requestAnimationFrame
  useEffect(() => {
    let animId: number;

    const syncSubtitles = () => {
      if (videoRef.current && !videoRef.current.paused) {
        const time = videoRef.current.currentTime;
        setCurrentTime(time);
        onTimeUpdate?.(time);

        const effectiveTime = Math.max(0, time + syncOffset);

        // Find active subtitle segment with intelligent gap bridging
        const active = segments.find((seg, index) => {
          const nextSeg = segments[index + 1];
          const maxEnd = nextSeg ? Math.min(nextSeg.start, seg.end + 0.35) : seg.end + 0.35;
          return effectiveTime >= seg.start && effectiveTime < maxEnd;
        });

        setActiveSegment(active || null);
      }
      animId = requestAnimationFrame(syncSubtitles);
    };

    animId = requestAnimationFrame(syncSubtitles);
    return () => cancelAnimationFrame(animId);
  }, [segments, syncOffset, onTimeUpdate]);

  // Handle video events
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    onTimeUpdate?.(time);

    const effectiveTime = Math.max(0, time + syncOffset);
    const active = segments.find((seg, index) => {
      const nextSeg = segments[index + 1];
      const maxEnd = nextSeg ? Math.min(nextSeg.start, seg.end + 0.35) : seg.end + 0.35;
      return effectiveTime >= seg.start && effectiveTime < maxEnd;
    });
    setActiveSegment(active || null);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 10);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = Number(e.target.value);
    if (!videoRef.current) return;
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Position class for overlay
  const positionClasses = {
    top: 'top-8 md:top-12',
    middle: 'top-1/2 -translate-y-1/2',
    bottom: 'bottom-16 md:bottom-20',
  }[position];

  return (
    <div className="flex flex-col items-center">
      {/* Phone/Shorts Frame */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[9/16] bg-black rounded-3xl overflow-hidden border-2 border-slate-700/60 shadow-2xl shadow-purple-950/40 group select-none"
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          loop
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full object-cover cursor-pointer"
          onClick={togglePlay}
        />

        {/* Live Subtitle Overlay */}
        {activeSegment && (
          <div
            className={`absolute left-0 right-0 px-4 text-center pointer-events-none transition-all duration-100 ${positionClasses}`}
          >
            <div
              key={activeSegment.id}
              className={`inline-block px-3 py-1.5 rounded-lg max-w-[92%] leading-snug break-words ${
                currentTemplate.cssClass
              } ${wordAnimation ? 'animate-sub-pop' : ''}`}
              style={{ fontSize: `${fontSize}px` }}
            >
              {templateId === 'highlight' && activeSegment.highlightWord ? (
                <span>
                  {activeSegment.translatedText.split(' ').map((word, idx) => {
                    const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').toLowerCase();
                    const isHighlight = cleanWord.includes(
                      activeSegment.highlightWord!.toLowerCase()
                    );
                    return isHighlight ? (
                      <span key={idx} className="text-red-500 font-black">
                        {word}{' '}
                      </span>
                    ) : (
                      <span key={idx}>{word} </span>
                    );
                  })}
                </span>
              ) : (
                activeSegment.translatedText
              )}
            </div>
          </div>
        )}

        {/* Center Play Button Overlay if paused */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer transition"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-purple-900/50 hover:scale-110 transition">
              <Play className="w-8 h-8 fill-current ml-1" />
            </div>
          </div>
        )}

        {/* Top Watermark / Status Badge */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] text-white/80 font-bold pointer-events-none">
          <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {currentTemplate.name}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md">
            9:16 Shorts
          </span>
        </div>

        {/* Bottom Player Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-1.5 opacity-90 group-hover:opacity-100 transition">
          {/* Progress Slider */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-purple-400 cursor-pointer h-1 rounded-full bg-white/20"
          />

          <div className="flex items-center justify-between text-white text-xs pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="p-1 hover:text-purple-300 transition cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="p-1 hover:text-purple-300 transition cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <span className="text-[11px] font-mono text-slate-300">
                {formatSeconds(currentTime)} / {formatSeconds(duration)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="p-1 hover:text-purple-300 transition cursor-pointer"
              title="Mulai dari awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mt-2 text-center">
        Preview langsung subtitle 9:16. Klik video untuk play/pause atau geser slider durasi.
      </p>
    </div>
  );
};
