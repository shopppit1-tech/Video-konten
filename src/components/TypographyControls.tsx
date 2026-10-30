import React from 'react';
import { Type, MoveVertical, Sparkles, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { SubtitlePosition } from '../types';

interface TypographyControlsProps {
  fontSize: number;
  position: SubtitlePosition;
  burnSubtitles: boolean;
  wordAnimation: boolean;
  syncOffset: number;
  onFontSizeChange: (size: number) => void;
  onPositionChange: (pos: SubtitlePosition) => void;
  onBurnSubtitlesChange: (burn: boolean) => void;
  onWordAnimationChange: (anim: boolean) => void;
  onSyncOffsetChange: (offset: number) => void;
}

export const TypographyControls: React.FC<TypographyControlsProps> = ({
  fontSize,
  position,
  burnSubtitles,
  wordAnimation,
  syncOffset,
  onFontSizeChange,
  onPositionChange,
  onBurnSubtitlesChange,
  onWordAnimationChange,
  onSyncOffsetChange,
}) => {
  return (
    <div className="pt-2 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Font Size Slider */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-white/5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-purple-400" />
              <span>Ukuran</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-xs font-mono font-bold">
              {fontSize}px
            </span>
          </div>

          <input
            type="range"
            min={18}
            max={64}
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Subtitle Position */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-white/5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <MoveVertical className="w-3.5 h-3.5 text-cyan-400" />
              <span>Posisi</span>
            </span>
            <span className="text-[11px] text-slate-400 capitalize">
              {position === 'bottom' ? 'Bawah' : position === 'middle' ? 'Tengah' : 'Atas'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'bottom', label: 'Bawah' },
              { id: 'middle', label: 'Tengah' },
              { id: 'top', label: 'Atas' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPositionChange(p.id as SubtitlePosition)}
                className={`py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  position === p.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sync Offset Slider */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-white/5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-pink-400" />
              <span>Sinkron Waktu</span>
            </span>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 text-xs font-mono font-bold">
                {syncOffset > 0 ? `+${syncOffset.toFixed(1)}s` : `${syncOffset.toFixed(1)}s`}
              </span>
              {syncOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => onSyncOffsetChange(0)}
                  title="Reset 0s"
                  className="p-0.5 text-slate-400 hover:text-white"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <input
            type="range"
            min={-2.0}
            max={2.0}
            step={0.1}
            value={syncOffset}
            onChange={(e) => onSyncOffsetChange(Number(e.target.value))}
            className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      {/* Clean Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
        <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/40 border border-white/5 cursor-pointer hover:bg-slate-900/70 transition">
          <input
            type="checkbox"
            checked={burnSubtitles}
            onChange={(e) => onBurnSubtitlesChange(e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 accent-purple-500 cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-200">
            Hardcode Subtitle ke Video MP4
          </span>
        </label>

        <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/40 border border-white/5 cursor-pointer hover:bg-slate-900/70 transition">
          <input
            type="checkbox"
            checked={wordAnimation}
            onChange={(e) => onWordAnimationChange(e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 accent-purple-500 cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <span>Animasi Pop-in Subtitle</span>
            <Sparkles className="w-3 h-3 text-pink-400" />
          </span>
        </label>
      </div>
    </div>
  );
};
