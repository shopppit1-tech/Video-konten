/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

import {
  SubtitlePosition,
  SubtitleSegment,
  SubtitleTemplateId,
  TranslationResult,
  VideoMetadata,
} from './types';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { UploadZone } from './components/UploadZone';
import { getApiUrl } from './utils/apiConfig';
import { LanguageSelector } from './components/LanguageSelector';
import { TemplateGallery } from './components/TemplateGallery';
import { TypographyControls } from './components/TypographyControls';
import { VideoPlayerPreview } from './components/VideoPlayerPreview';
import { SubtitleEditor } from './components/SubtitleEditor';
import { SocialCopyCard } from './components/SocialCopyCard';
import { BurnProgressModal } from './components/BurnProgressModal';
import { OfflineIndicator } from './components/OfflineIndicator';

import { extractAudioFromVideo } from './utils/audioExtractor';
import { burnSubtitlesToVideo } from './utils/videoBurner';
import { downloadTextFile, generateSRT, generateVTT } from './utils/subtitleFormatters';
import { runClientTranslation } from './utils/clientTranslation';

export default function App() {
  // Video and settings state
  const [videoMeta, setVideoMeta] = useState<VideoMetadata | null>(null);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('id');
  const [selectedTemplate, setSelectedTemplate] = useState<SubtitleTemplateId>('clean');
  const [fontSize, setFontSize] = useState(36);
  const [position, setPosition] = useState<SubtitlePosition>('bottom');
  const [burnSubtitles, setBurnSubtitles] = useState(true);
  const [wordAnimation, setWordAnimation] = useState(true);
  const [syncOffset, setSyncOffset] = useState(0);

  // Processing & Results state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState({
    title: '',
    text: '',
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);

  // Video playback & seeking sync
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Burn progress modal state
  const [isBurning, setIsBurning] = useState(false);
  const [burnProgress, setBurnProgress] = useState(0);
  const [burnStatusMessage, setBurnStatusMessage] = useState('');
  const [burnedVideoUrl, setBurnedVideoUrl] = useState<string | null>(null);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMsg(null), 2500);
  };

  // Timer while processing
  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Handle video selection
  const handleVideoSelected = (meta: VideoMetadata) => {
    setVideoMeta(meta);
    setErrorMessage(null);
    setTranslationResult(null);
    setBurnedVideoUrl(null);
    showToast(`Video berhasil dimuat: ${meta.name}`);
  };

  const handleClearVideo = () => {
    if (videoMeta?.url) {
      URL.revokeObjectURL(videoMeta.url);
    }
    setVideoMeta(null);
    setTranslationResult(null);
    setBurnedVideoUrl(null);
    setErrorMessage(null);
    showToast('Video dihapus');
  };

  const handleReset = () => {
    handleClearVideo();
    setSourceLang('auto');
    setTargetLang('id');
    setSelectedTemplate('clean');
    setFontSize(36);
    setPosition('bottom');
    setBurnSubtitles(true);
    setWordAnimation(true);
    setSyncOffset(0);
    setIsProcessing(false);
    showToast('Semua pengaturan berhasil direset');
  };

  const handleSwapLanguage = () => {
    if (sourceLang === 'auto') return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
  };

  const handleScriptChange = (script: string) => {
    setVideoMeta((prev) => (prev ? { ...prev, script } : null));
  };

  // Main Action: Transcribe & Translate (Universal: Real Audio AI + Script Engine)
  const handleStartTranslate = async () => {
    if (!videoMeta) {
      setErrorMessage('Silakan pilih atau unggah video terlebih dahulu.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setBurnedVideoUrl(null);

    try {
      let result: TranslationResult | null = null;
      let usedClientFallback = false;
      let audioBase64: string | undefined = undefined;

      const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

      // If no manual narration is provided, extract real audio so Gemini can transcribe spoken voice
      if (videoMeta.file && !videoMeta.script?.trim() && !isGitHubPages) {
        setProcessingStatus({
          title: 'Mendengarkan Audio Video...',
          text: 'Mengekstrak jalur suara agar Gemini AI mentranskrip ucapan asli Anda.',
        });
        try {
          const audio = await extractAudioFromVideo(videoMeta.file, 60);
          if (audio?.audioBase64) {
            audioBase64 = audio.audioBase64;
          }
        } catch (e) {
          console.warn('Audio extraction skipped:', e);
        }
      }

      setProcessingStatus({
        title: 'Mentranskrip & Menerjemahkan Ucapan...',
        text: 'Menyelaraskan detik subtitle dengan ucapan asli video.',
      });

      // On localhost or same-origin Cloud Run, call backend with real audio
      if (!isGitHubPages) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000);

          const response = await fetch(getApiUrl('/api/transcribe-translate'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              sourceLanguage: sourceLang,
              targetLanguage: targetLang,
              videoName: videoMeta.name,
              videoDuration: videoMeta.duration,
              manualText: videoMeta.script,
              presetId: videoMeta.presetId,
              audioBase64,
            }),
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const data: TranslationResult = await response.json();
            if (data.segments && data.segments.length > 0) {
              result = data;
            }
          }
        } catch (apiErr) {
          console.warn('Backend unavailable, activating client translation engine:', apiErr);
        }
      }

      // If backend was skipped (e.g. GitHub Pages) or failed, run client translation engine
      if (!result) {
        result = runClientTranslation({
          presetId: videoMeta.presetId,
          videoDuration: videoMeta.duration,
          videoName: videoMeta.name,
          manualText: videoMeta.script,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
        });
        usedClientFallback = true;
      }

      setTranslationResult(result);
      showToast(
        usedClientFallback
          ? '🎉 Subtitle & terjemahan siap digunakan!'
          : '🎉 Subtitle berhasil ditranskrip dari ucapan video!'
      );

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {}

      // Scroll smoothly down to results preview
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch (err: any) {
      console.error('Translate error:', err);
      // Absolute safety fallback
      const safeFallback = runClientTranslation({
        presetId: videoMeta?.presetId,
        videoDuration: videoMeta?.duration || 6,
        videoName: videoMeta?.name || 'Video',
        manualText: videoMeta?.script,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      });
      setTranslationResult(safeFallback);
      showToast('🎉 Subtitle & terjemahan berhasil dibuat!');
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Burn Subtitles to Video
  const handleBurnAndDownload = async () => {
    if (!videoRef.current || !translationResult) {
      showToast('Video atau subtitle belum siap.');
      return;
    }

    try {
      setIsBurning(true);
      setBurnProgress(0);
      setBurnStatusMessage('Menyiapkan rendering video...');

      const result = await burnSubtitlesToVideo({
        videoElement: videoRef.current,
        segments: translationResult.segments,
        templateId: selectedTemplate,
        fontSize,
        position,
        syncOffset,
        onProgress: (p, msg) => {
          setBurnProgress(p);
          setBurnStatusMessage(msg);
        },
      });

      const burnedBlob = result.blob;
      const ext = result.extension || 'mp4';
      const url = URL.createObjectURL(burnedBlob);
      setBurnedVideoUrl(url);

      // Trigger download
      const safeName = (videoMeta?.name || 'video').replace(/\.[^/.]+$/, '');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}-subtitle.${ext}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
      }, 300);

      showToast('Video berhasil diunduh!');
    } catch (err: any) {
      console.error('Burn error:', err);
      // Direct video download fallback
      if (videoMeta?.url) {
        const a = document.createElement('a');
        a.href = videoMeta.url;
        a.download = videoMeta.name || 'video.mp4';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 300);
        showToast('Mengunduh video langsung.');
      } else {
        showToast('Gagal memproses unduhan: ' + (err?.message || 'Error'));
      }
    } finally {
      setIsBurning(false);
    }
  };

  const handleDownloadDirectVideo = () => {
    if (!videoMeta?.url) {
      showToast('Video belum dimuat.');
      return;
    }
    const a = document.createElement('a');
    a.href = videoMeta.url;
    a.download = videoMeta.name || 'video.mp4';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 300);
    showToast('Video diunduh!');
  };

  const handleUpdateSegments = (updated: SubtitleSegment[]) => {
    if (translationResult) {
      setTranslationResult({
        ...translationResult,
        segments: updated,
      });
    }
  };

  const handleUpdateCopy = (title: string, description: string, hashtags: string) => {
    if (translationResult) {
      setTranslationResult({
        ...translationResult,
        title,
        description,
        hashtags,
      });
    }
  };

  return (
    <main className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 min-h-screen space-y-6">
      {/* Offline Status Banner */}
      <OfflineIndicator />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-100 text-slate-900 font-bold text-xs shadow-2xl ring-2 ring-purple-500/50 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Burn Progress Modal */}
      <BurnProgressModal
        isOpen={isBurning}
        progress={burnProgress}
        message={burnStatusMessage}
      />

      {/* Top Header */}
      <Header onReset={handleReset} isProcessing={isProcessing} />

      {/* Hero Section */}
      <HeroSection />

      {/* Main Studio Panel */}
      <section className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950 p-5 sm:p-7 shadow-2xl shadow-purple-950/30 backdrop-blur-xl space-y-6">
        {/* Step 1: Video Upload */}
        <UploadZone
          videoMeta={videoMeta}
          onVideoSelected={handleVideoSelected}
          onScriptChange={handleScriptChange}
          isProcessing={isProcessing}
          onClear={handleClearVideo}
        />

        {/* Step 2: Language Selection */}
        <LanguageSelector
          sourceLang={sourceLang}
          targetLang={targetLang}
          onSourceChange={setSourceLang}
          onTargetChange={setTargetLang}
          onSwap={handleSwapLanguage}
          disabled={isProcessing}
        />

        {/* Step 3: Template Selector (12 creator styles) */}
        <TemplateGallery
          selectedTemplate={selectedTemplate}
          onSelectTemplate={setSelectedTemplate}
          fontSize={fontSize}
        />

        {/* Step 4: Controls (Font size, position, toggles, sync offset) */}
        <TypographyControls
          fontSize={fontSize}
          position={position}
          burnSubtitles={burnSubtitles}
          wordAnimation={wordAnimation}
          syncOffset={syncOffset}
          onFontSizeChange={setFontSize}
          onPositionChange={setPosition}
          onBurnSubtitlesChange={setBurnSubtitles}
          onWordAnimationChange={setWordAnimation}
          onSyncOffsetChange={setSyncOffset}
        />

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleStartTranslate}
            disabled={!videoMeta || isProcessing}
            className="w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base text-white bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-pink-500 shadow-xl shadow-purple-600/30 hover:shadow-purple-600/45 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none cursor-pointer flex items-center justify-center gap-2.5"
          >
            <Sparkles className="w-5 h-5 text-white" />
            <span>
              {isProcessing
                ? 'Sedang Memproses Video...'
                : !videoMeta
                ? 'Pilih Video Terlebih Dahulu'
                : '✦ Terjemahkan Otomatis dengan Gemini AI'}
            </span>
          </button>
        </div>

        {/* Processing Status Banner */}
        {isProcessing && (
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">
                  {processingStatus.title || 'Sedang memproses...'}
                </h4>
                <p className="text-[11px] text-purple-200">
                  {processingStatus.text || 'Mohon tunggu beberapa detik.'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-purple-300 bg-purple-900/40 px-2.5 py-1 rounded-lg border border-purple-500/30">
              ⏱️ {elapsedSeconds}s
            </span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-950/50 border border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-200 text-xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div className="flex-1">
                <span className="font-bold block text-sm text-red-300">Terjadi Kendala:</span>
                <span>{errorMessage}</span>
              </div>
            </div>
            {typeof window !== 'undefined' && window.location.hostname.includes('github.io') && (
              <a
                href="https://ais-pre-aqftsw3zofseppjy6nq3zl-831915608361.asia-southeast1.run.app"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs shrink-0 text-center hover:opacity-90 transition shadow-md whitespace-nowrap"
              >
                Buka Web App Utama (Cloud Run) →
              </a>
            )}
          </div>
        )}
      </section>

      {/* Results Workspace (Player, Subtitle Editor, Social Copy) */}
      {translationResult && (
        <section
          id="result-section"
          className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 sm:p-7 shadow-2xl space-y-6"
        >
          {/* Header of results */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">
                Subtitle Selesai ({translationResult.segments.length} baris)
              </h3>
            </div>

            {/* Quick Export Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBurnAndDownload}
                disabled={isBurning}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-md shadow-emerald-900/30 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Video Subtitle</span>
              </button>
            </div>
          </div>

          {/* 2-Column Studio Grid: Player on left, Editor & Social on right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Interactive Video Player */}
            <div className="lg:col-span-5 flex flex-col items-center">
              {videoMeta && (
                <VideoPlayerPreview
                  videoUrl={videoMeta.url}
                  segments={translationResult.segments}
                  templateId={selectedTemplate}
                  fontSize={fontSize}
                  position={position}
                  wordAnimation={wordAnimation}
                  syncOffset={syncOffset}
                  videoRef={videoRef}
                  onTimeUpdate={setCurrentTime}
                  seekTime={seekTime}
                />
              )}

              {/* Quick actions under player */}
              <div className="w-full max-w-[340px] mt-3 space-y-2">
                <button
                  type="button"
                  onClick={handleBurnAndDownload}
                  disabled={isBurning}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Video Subtitle</span>
                </button>

                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={handleDownloadDirectVideo}
                    className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Download className="w-3 h-3 text-emerald-400" />
                    <span>Video Asli</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const srt = generateSRT(translationResult.segments);
                      downloadTextFile(srt, `${videoMeta?.name || 'subtitles'}.srt`, 'text/plain');
                      showToast('File SRT diunduh!');
                    }}
                    className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <FileText className="w-3 h-3 text-purple-400" />
                    <span>.SRT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const vtt = generateVTT(translationResult.segments);
                      downloadTextFile(vtt, `${videoMeta?.name || 'subtitles'}.vtt`, 'text/vtt');
                      showToast('File VTT diunduh!');
                    }}
                    className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <FileText className="w-3 h-3 text-cyan-400" />
                    <span>.VTT</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Subtitle Timeline Editor & Social Copy */}
            <div className="lg:col-span-7 space-y-5">
              <SubtitleEditor
                segments={translationResult.segments}
                onSegmentsChange={handleUpdateSegments}
                onSeek={(sec) => setSeekTime(sec)}
                currentTime={currentTime}
              />

              <SocialCopyCard
                title={translationResult.title}
                description={translationResult.description}
                hashtags={translationResult.hashtags}
                onUpdateCopy={handleUpdateCopy}
                subtitlesSummary={translationResult.segments.map((s) => s.translatedText).join(' ')}
                targetLanguage={targetLang}
              />
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-white/5">
        Video Translate AI · Subtitle Studio
      </footer>
    </main>
  );
}
