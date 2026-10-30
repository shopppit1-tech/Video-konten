import React, { useState } from 'react';
import { Copy, Check, Share2, Sparkles, RefreshCw } from 'lucide-react';

interface SocialCopyCardProps {
  title: string;
  description: string;
  hashtags: string;
  onUpdateCopy: (title: string, description: string, hashtags: string) => void;
  subtitlesSummary?: string;
  targetLanguage: string;
}

export const SocialCopyCard: React.FC<SocialCopyCardProps> = ({
  title,
  description,
  hashtags,
  onUpdateCopy,
  subtitlesSummary = '',
  targetLanguage,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedTone, setSelectedTone] = useState('Viral Hook');

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      const res = await fetch('/api/regenerate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: subtitlesSummary,
          targetLanguage,
          tone: selectedTone,
        }),
      });
      const data = await res.json();
      if (data.title && data.description && data.hashtags) {
        onUpdateCopy(data.title, data.description, data.hashtags);
      }
    } catch (err) {
      console.warn('Error regenerating copy:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-300 flex items-center justify-center">
            <Share2 className="w-4 h-4 text-pink-400" />
          </div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider m-0">
            Copywriting Medsos
          </h4>
        </div>

        {/* Tone Selector & Regenerate */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTone}
            onChange={(e) => setSelectedTone(e.target.value)}
            disabled={isRegenerating}
            className="bg-slate-800 text-xs text-slate-200 border border-white/10 rounded-lg px-2 py-1 outline-none cursor-pointer"
          >
            <option value="Viral Hook">Gaya: Viral Hook</option>
            <option value="Edukasi & Tips">Gaya: Edukasi</option>
            <option value="Storytelling">Gaya: Storytelling</option>
            <option value="Santai & Lucu">Gaya: Santai</option>
          </select>

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-600/30 text-purple-200 border border-purple-500/30 hover:bg-purple-600/50 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>Generate Ulang</span>
          </button>
        </div>
      </div>

      {/* Title Field */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Judul Video (Click-Through Hook)</span>
          <button
            type="button"
            onClick={() => copyToClipboard(title, 'title')}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-300 hover:text-white transition cursor-pointer"
          >
            {copiedField === 'title' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Judul</span>
              </>
            )}
          </button>
        </div>
        <textarea
          rows={2}
          value={title}
          onChange={(e) => onUpdateCopy(e.target.value, description, hashtags)}
          className="w-full bg-slate-950/80 text-white text-xs rounded-xl p-2.5 border border-white/10 focus:border-purple-400 outline-none resize-none font-medium"
        />
      </div>

      {/* Description Field */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Deskripsi & Caption</span>
          <button
            type="button"
            onClick={() => copyToClipboard(description, 'desc')}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-300 hover:text-white transition cursor-pointer"
          >
            {copiedField === 'desc' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Deskripsi</span>
              </>
            )}
          </button>
        </div>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => onUpdateCopy(title, e.target.value, hashtags)}
          className="w-full bg-slate-950/80 text-white text-xs rounded-xl p-2.5 border border-white/10 focus:border-purple-400 outline-none resize-none"
        />
      </div>

      {/* Hashtags Field */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Hashtags Trending</span>
          <button
            type="button"
            onClick={() => copyToClipboard(hashtags, 'tags')}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-300 hover:text-white transition cursor-pointer"
          >
            {copiedField === 'tags' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Hashtags</span>
              </>
            )}
          </button>
        </div>
        <input
          type="text"
          value={hashtags}
          onChange={(e) => onUpdateCopy(title, description, e.target.value)}
          className="w-full bg-slate-950/80 text-purple-300 font-mono text-xs rounded-xl p-2.5 border border-white/10 focus:border-purple-400 outline-none"
        />
      </div>
    </div>
  );
};
