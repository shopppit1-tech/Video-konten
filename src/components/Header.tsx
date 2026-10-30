import React from 'react';
import { Sparkles, RotateCcw, Cpu } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onReset: () => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, isProcessing }) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-white/10">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr from-purple-600 via-violet-500 to-pink-500 shadow-md shadow-purple-500/20 ring-1 ring-white/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-extrabold tracking-tight text-white m-0">
            Video Translate AI
          </h1>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Cpu className="w-3 h-3 text-purple-400" />
            Gemini
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <PWAInstallButton />

        <button
          type="button"
          onClick={onReset}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
};
