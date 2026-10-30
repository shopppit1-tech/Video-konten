import { SubtitlePosition, SubtitleSegment, SubtitleTemplateId } from '../types';

interface BurnOptions {
  videoElement: HTMLVideoElement;
  segments: SubtitleSegment[];
  templateId: SubtitleTemplateId;
  fontSize: number;
  position: SubtitlePosition;
  syncOffset?: number;
  onProgress?: (progress: number, message: string) => void;
  onCancel?: () => void;
}

export interface BurnResult {
  blob: Blob;
  mimeType: string;
  extension: string;
}

export async function burnSubtitlesToVideo({
  videoElement,
  segments,
  templateId,
  fontSize,
  position,
  syncOffset = 0,
  onProgress,
}: BurnOptions): Promise<BurnResult> {
  return new Promise(async (resolve, reject) => {
    let animationFrameId: number | null = null;
    let safetyTimeoutId: any = null;
    let stallCheckInterval: any = null;
    let hasFinished = false;

    // Use a dedicated offscreen video element so the main screen preview NEVER stutters or freezes
    const renderVideo = document.createElement('video');
    renderVideo.crossOrigin = 'anonymous';
    renderVideo.playsInline = true;
    renderVideo.preload = 'auto';
    renderVideo.src = videoElement.src;

    const cleanup = () => {
      hasFinished = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
      if (stallCheckInterval) clearInterval(stallCheckInterval);
      try {
        renderVideo.pause();
        renderVideo.removeAttribute('src');
        renderVideo.load();
      } catch {}
    };

    try {
      onProgress?.(5, 'Menyiapkan canvas & resolusi video...');

      // Wait for offscreen video metadata
      await new Promise<void>((res, rej) => {
        if (renderVideo.readyState >= 1) return res();
        renderVideo.onloadedmetadata = () => res();
        renderVideo.onerror = () => rej(new Error('Gagal memuat video untuk proses render.'));
        setTimeout(() => res(), 3000); // Safety timeout
      });

      const rawWidth = renderVideo.videoWidth || videoElement.videoWidth || 720;
      const rawHeight = renderVideo.videoHeight || videoElement.videoHeight || 1280;
      const duration = Math.max(1, renderVideo.duration || videoElement.duration || 6);

      // Downscale high-res (e.g. 1080p, 4K) to maximum 720p width to guarantee silky smooth encoding without freezing
      let targetWidth = rawWidth;
      let targetHeight = rawHeight;
      const MAX_DIM = 1280;

      if (Math.max(rawWidth, rawHeight) > MAX_DIM) {
        const ratio = rawWidth / rawHeight;
        if (rawWidth > rawHeight) {
          targetWidth = MAX_DIM;
          targetHeight = Math.round(MAX_DIM / ratio);
        } else {
          targetHeight = MAX_DIM;
          targetWidth = Math.round(MAX_DIM * ratio);
        }
      }

      // Ensure dimensions are even numbers (required by many video encoders)
      targetWidth = Math.floor(targetWidth / 2) * 2;
      targetHeight = Math.floor(targetHeight / 2) * 2;

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d', { alpha: false })!;

      // Setup audio capture stream safely with resume to prevent suspended-AudioContext freezing
      let audioDest: MediaStreamAudioDestinationNode | null = null;
      let audioCtx: AudioContext | null = null;

      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          audioCtx = new AudioCtxClass();
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
          }
          const source = audioCtx.createMediaElementSource(renderVideo);
          audioDest = audioCtx.createMediaStreamDestination();
          source.connect(audioDest);
        }
      } catch (audioErr) {
        console.warn('Audio capture stream fallback:', audioErr);
      }

      // Capture stream from canvas (30 FPS for optimal performance and file size)
      const canvasStream = canvas.captureStream ? canvas.captureStream(30) : (canvas as any).mozCaptureStream?.(30);
      if (!canvasStream) {
        cleanup();
        throw new Error('Browser tidak mendukung perekaman kanvas video.');
      }

      // Add audio track if captured
      if (audioDest && audioDest.stream.getAudioTracks().length > 0) {
        audioDest.stream.getAudioTracks().forEach((track) => canvasStream.addTrack(track));
      }

      // Select best supported MIME type
      const candidateMimes = [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];

      let mimeType = 'video/webm';
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
        for (const candidate of candidateMimes) {
          if (MediaRecorder.isTypeSupported(candidate)) {
            mimeType = candidate;
            break;
          }
        }
      }

      const isMp4 = mimeType.includes('mp4');
      const extension = isMp4 ? 'mp4' : 'webm';

      const recorder = new MediaRecorder(canvasStream, {
        mimeType,
        videoBitsPerSecond: 3500000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const finishRecording = () => {
        if (hasFinished) return;
        cleanup();

        onProgress?.(100, 'Menyiapkan file download...');

        if (recorder.state !== 'inactive') {
          recorder.onstop = () => {
            const finalBlob = new Blob(chunks, { type: mimeType });
            resolve({ blob: finalBlob, mimeType, extension });
          };
          recorder.stop();
        } else {
          const finalBlob = new Blob(chunks, { type: mimeType });
          resolve({ blob: finalBlob, mimeType, extension });
        }
      };

      // Reset offscreen video to beginning
      renderVideo.currentTime = 0;
      renderVideo.muted = !audioDest; // mute if no audio destination to prevent echo

      await new Promise<void>((r) => {
        const onSeeked = () => {
          renderVideo.removeEventListener('seeked', onSeeked);
          r();
        };
        renderVideo.addEventListener('seeked', onSeeked);
        setTimeout(r, 400); // Safety fallback
      });

      recorder.start(100);

      try {
        await renderVideo.play();
      } catch {
        renderVideo.muted = true;
        await renderVideo.play();
      }

      // Stall detector: if video doesn't advance for 2 seconds, nudge it forward
      let lastTime = 0;
      let stallCount = 0;
      stallCheckInterval = setInterval(() => {
        if (hasFinished) return;
        if (renderVideo.currentTime === lastTime && !renderVideo.paused && !renderVideo.ended) {
          stallCount++;
          if (stallCount >= 2) {
            renderVideo.currentTime += 0.1;
            stallCount = 0;
          }
        } else {
          lastTime = renderVideo.currentTime;
          stallCount = 0;
        }
      }, 1000);

      function renderLoop() {
        if (hasFinished) return;

        const currentTime = renderVideo.currentTime;
        const percent = Math.min(99, Math.round((currentTime / duration) * 100));
        onProgress?.(percent, `Menempelkan subtitle (${percent}%)...`);

        // Draw video frame to canvas
        ctx.drawImage(renderVideo, 0, 0, targetWidth, targetHeight);

        // Find active subtitle segment
        const effectiveTime = Math.max(0, currentTime + syncOffset);
        const activeSeg = segments.find((s, index) => {
          const nextSeg = segments[index + 1];
          const maxEnd = nextSeg ? Math.min(nextSeg.start, s.end + 0.35) : s.end + 0.35;
          return effectiveTime >= s.start && effectiveTime < maxEnd;
        });

        if (activeSeg) {
          drawSubtitleOnCanvas(ctx, activeSeg, templateId, fontSize, position, targetWidth, targetHeight);
        }

        // Check if finished
        if (renderVideo.ended || currentTime >= duration - 0.05) {
          finishRecording();
          return;
        }

        animationFrameId = requestAnimationFrame(renderLoop);
      }

      renderLoop();

      renderVideo.onended = () => {
        finishRecording();
      };

      // Guaranteed safety timeout (duration + 2.5 seconds max)
      safetyTimeoutId = setTimeout(() => {
        if (!hasFinished) {
          finishRecording();
        }
      }, (duration + 2.5) * 1000);

      renderVideo.onerror = () => {
        cleanup();
        reject(new Error('Gagal memutar video saat render.'));
      };
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}

function drawSubtitleOnCanvas(
  ctx: CanvasRenderingContext2D,
  seg: SubtitleSegment,
  templateId: SubtitleTemplateId,
  fontSize: number,
  position: SubtitlePosition,
  canvasWidth: number,
  canvasHeight: number
) {
  // Scale font relative to 720p base width
  const scale = canvasWidth / 720;
  const scaledFontSize = Math.round(fontSize * scale * 1.2);

  let y = canvasHeight * 0.82;
  if (position === 'middle') {
    y = canvasHeight * 0.5;
  } else if (position === 'top') {
    y = canvasHeight * 0.18;
  }

  const text = seg.translatedText;
  const words = text.split(' ');

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Apply template styles
  switch (templateId) {
    case 'bold': {
      ctx.font = `900 ${scaledFontSize}px "Montserrat", sans-serif`;
      const upper = text.toUpperCase();

      // Black stroke
      ctx.lineWidth = Math.max(6, scaledFontSize * 0.16);
      ctx.strokeStyle = '#000000';
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 2;
      ctx.strokeText(upper, canvasWidth / 2, y);

      // Deep pop shadow
      ctx.fillStyle = '#000000';
      ctx.fillText(upper, canvasWidth / 2 + 3, y + 4);

      // White fill
      ctx.fillStyle = '#ffffff';
      ctx.fillText(upper, canvasWidth / 2, y);
      break;
    }

    case 'neon': {
      ctx.font = `800 ${scaledFontSize}px "Montserrat", sans-serif`;
      ctx.shadowColor = '#00eaff';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#67f6ff';
      ctx.fillText(text, canvasWidth / 2, y);
      ctx.fillText(text, canvasWidth / 2, y);
      break;
    }

    case 'cinema': {
      ctx.font = `800 ${scaledFontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#ffdf65';
      ctx.fillText(text, canvasWidth / 2, y);
      break;
    }

    case 'pink': {
      ctx.font = `900 ${scaledFontSize}px "Montserrat", sans-serif`;
      ctx.shadowColor = '#ff1493';
      ctx.shadowBlur = 14;
      ctx.lineWidth = Math.max(4, scaledFontSize * 0.1);
      ctx.strokeStyle = '#000000';
      ctx.strokeText(text, canvasWidth / 2, y);
      ctx.fillStyle = '#ff7dcc';
      ctx.fillText(text, canvasWidth / 2, y);
      break;
    }

    case 'creator': {
      ctx.font = `900 ${scaledFontSize}px "Montserrat", sans-serif`;
      ctx.lineWidth = Math.max(5, scaledFontSize * 0.12);
      ctx.strokeStyle = '#052813';
      ctx.strokeText(text, canvasWidth / 2, y);
      ctx.fillStyle = '#8affad';
      ctx.fillText(text, canvasWidth / 2, y);
      break;
    }

    case 'outline': {
      ctx.font = `900 ${scaledFontSize}px "Montserrat", sans-serif`;
      ctx.lineWidth = Math.max(7, scaledFontSize * 0.18);
      ctx.strokeStyle = '#111111';
      ctx.strokeText(text, canvasWidth / 2, y);
      ctx.fillStyle = '#ffed4a';
      ctx.fillText(text, canvasWidth / 2, y);
      break;
    }

    case 'gradient': {
      ctx.font = `900 ${scaledFontSize}px "Montserrat", sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;

      const grad = ctx.createLinearGradient(
        canvasWidth / 2 - 200,
        y - 30,
        canvasWidth / 2 + 200,
        y + 30
      );
      grad.addColorStop(0, '#c084fc');
      grad.addColorStop(0.5, '#67e8f9');
      grad.addColorStop(1, '#f472b6');

      ctx.fillStyle = grad;
      ctx.fillText(text, canvasWidth / 2, y);
      break;
    }

    case 'shadow': {
      ctx.font = `800 ${scaledFontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, canvasWidth / 2, y);
      break;
    }

    case 'karaoke': {
      ctx.font = `900 ${scaledFontSize}px "Montserrat", sans-serif`;
      ctx.shadowColor = '#00d9ff';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#0f172a';
      ctx.strokeText(text, canvasWidth / 2, y);
      ctx.fillStyle = '#4ff4ff';
      ctx.fillText(text, canvasWidth / 2, y);
      break;
    }

    case 'highlight': {
      ctx.font = `900 ${scaledFontSize}px "Montserrat", sans-serif`;
      const highlight = seg.highlightWord?.toLowerCase();
      const totalWidth = ctx.measureText(text).width;
      let startX = canvasWidth / 2 - totalWidth / 2;

      ctx.textAlign = 'left';
      words.forEach((w) => {
        const cleanW = w.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').toLowerCase();
        const isTarget = highlight && cleanW.includes(highlight);

        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;

        if (isTarget) {
          ctx.fillStyle = '#ff4d4d';
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#ffffff';
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.lineWidth = 0;
        }

        ctx.fillText(w + ' ', startX, y);
        startX += ctx.measureText(w + ' ').width;
      });
      break;
    }

    case 'minimal': {
      ctx.font = `600 ${scaledFontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, canvasWidth / 2, y);
      break;
    }

    case 'clean':
    default: {
      ctx.font = `800 ${scaledFontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, canvasWidth / 2, y);
      break;
    }
  }

  ctx.restore();
}
