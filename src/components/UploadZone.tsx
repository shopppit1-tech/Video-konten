import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { VideoMetadata } from '../types';

interface UploadZoneProps {
  videoMeta: VideoMetadata | null;
  onVideoSelected: (meta: VideoMetadata) => void;
  isProcessing: boolean;
  onClear: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  videoMeta,
  onVideoSelected,
  isProcessing,
  onClear,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('video/')) {
      setErrorMsg('File harus berformat video (MP4, MOV, atau WEBM).');
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      setErrorMsg('Ukuran file video maksimal 200 MB.');
      return;
    }

    const url = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = url;

    tempVideo.onloadedmetadata = () => {
      onVideoSelected({
        file,
        url,
        name: file.name,
        size: file.size,
        duration: Math.round(tempVideo.duration) || 10,
        width: tempVideo.videoWidth || 720,
        height: tempVideo.videoHeight || 1280,
      });
    };

    tempVideo.onerror = () => {
      setErrorMsg('Gagal memuat video.');
    };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      {videoMeta ? (
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-3 sm:p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-white text-sm truncate max-w-[200px] sm:max-w-md block">
                {videoMeta.name}
              </span>
              <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                <span>⏱️ {videoMeta.duration}s</span>
                <span>📐 {videoMeta.width}x{videoMeta.height}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              Ganti Video
            </button>
            <button
              type="button"
              onClick={onClear}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 transition cursor-pointer"
            >
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group rounded-2xl border-2 border-dashed p-6 transition-all duration-200 text-center cursor-pointer flex flex-col items-center justify-center min-h-[140px] ${
            isDragging
              ? 'border-purple-400 bg-purple-900/30 scale-[1.01]'
              : 'border-purple-500/30 bg-slate-900/40 hover:border-purple-400/60 hover:bg-purple-950/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:scale-105 transition">
            <UploadCloud className="w-5 h-5" />
          </div>

          <p className="mt-2 text-sm font-bold text-white">
            Pilih atau seret video ke sini
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            MP4, MOV, WEBM (Rasio 9:16 Shorts, Reels, TikTok)
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
