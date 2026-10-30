import React, { useState } from 'react';
import { DownloadCloud, Check, Copy } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);

  const apkLink =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-aqftsw3zofseppjy6nq3zl-831915608361.asia-southeast1.run.app';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(apkLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const el = document.createElement('textarea');
      el.value = apkLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
        <Check className="w-3.5 h-3.5" />
        <span>Terinstal</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isInstallable ? (
        <button
          type="button"
          onClick={install}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-sm transition cursor-pointer"
        >
          <DownloadCloud className="w-3.5 h-3.5" />
          <span>Install APK</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition cursor-pointer"
          title="Salin link untuk install di HP"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
          <span>{copied ? 'Tersalin' : 'Link APK'}</span>
        </button>
      )}
    </div>
  );
};
