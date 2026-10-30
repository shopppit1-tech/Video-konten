import React from 'react';
import { ArrowLeftRight, Globe2 } from 'lucide-react';

interface LanguageSelectorProps {
  sourceLang: string;
  targetLang: string;
  onSourceChange: (lang: string) => void;
  onTargetChange: (lang: string) => void;
  onSwap: () => void;
  disabled?: boolean;
}

const LANGUAGES = [
  { code: 'auto', name: 'Deteksi Otomatis (AI)', flag: '🌐' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語 (Jepang)', flag: '🇯🇵' },
  { code: 'ko', name: '한국어 (Korea)', flag: '🇰🇷' },
  { code: 'zh', name: '中文 (Mandarin)', flag: '🇨🇳' },
  { code: 'es', name: 'Español (Spanyol)', flag: '🇪🇸' },
  { code: 'ar', name: 'العربية (Arab)', flag: '🇸🇦' },
  { code: 'de', name: 'Deutsch (Jerman)', flag: '🇩🇪' },
  { code: 'fr', name: 'Français (Prancis)', flag: '🇫🇷' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
  onSwap,
  disabled = false,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-3 items-end pt-2">
      {/* Source Language */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Globe2 className="w-3.5 h-3.5 text-purple-400" />
          <span>Bahasa sumber video</span>
        </label>
        <div className="relative">
          <select
            value={sourceLang}
            onChange={(e) => onSourceChange(e.target.value)}
            disabled={disabled}
            className="w-full bg-slate-900/90 text-white text-xs sm:text-sm font-semibold rounded-xl border border-white/15 px-3 py-2.5 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition cursor-pointer disabled:opacity-50"
          >
            {LANGUAGES.map((lang) => (
              <option key={`src-${lang.code}`} value={lang.code} className="bg-slate-900 text-white">
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center pb-0.5">
        <button
          type="button"
          onClick={onSwap}
          disabled={disabled || sourceLang === 'auto'}
          title="Tukar bahasa"
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-purple-500/30 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>
      </div>

      {/* Target Language */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <span className="text-pink-400 font-black">✦</span>
          <span>Bahasa hasil terjemahan</span>
        </label>
        <div className="relative">
          <select
            value={targetLang}
            onChange={(e) => onTargetChange(e.target.value)}
            disabled={disabled}
            className="w-full bg-slate-900/90 text-white text-xs sm:text-sm font-semibold rounded-xl border border-purple-500/40 px-3 py-2.5 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition cursor-pointer disabled:opacity-50"
          >
            {LANGUAGES.filter((l) => l.code !== 'auto').map((lang) => (
              <option key={`tgt-${lang.code}`} value={lang.code} className="bg-slate-900 text-white">
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
