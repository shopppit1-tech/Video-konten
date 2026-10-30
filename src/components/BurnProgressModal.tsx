import React from 'react';
import { Loader2, Film, CheckCircle2 } from 'lucide-react';

interface BurnProgressModalProps {
  isOpen: boolean;
  progress: number;
  message: string;
}

export const BurnProgressModal: React.FC<BurnProgressModalProps> = ({
  isOpen,
  progress,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-purple-500/30 p-6 shadow-2xl shadow-purple-950/60 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 mx-auto flex items-center justify-center shadow-lg shadow-purple-500/30">
          {progress >= 100 ? (
            <CheckCircle2 className="w-8 h-8 text-white" />
          ) : (
            <Film className="w-8 h-8 text-white animate-pulse" />
          )}
        </div>

        <div>
          <h3 className="text-lg font-extrabold text-white">
            {progress >= 100 ? 'Video Siap Diunduh!' : 'Menempelkan Subtitle ke Video'}
          </h3>
          <p className="text-xs text-slate-300 mt-1">{message}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-mono font-bold text-purple-300">
            <span>Rendering Canvas</span>
            <span>{progress}%</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Proses merender video dengan gaya subtitle pilihanmu langsung di browser tanpa kompresi kualitas.
        </p>
      </div>
    </div>
  );
};
