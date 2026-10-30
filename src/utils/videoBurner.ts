import { SubtitlePosition, SubtitleSegment, SubtitleTemplateId } from '../types';

interface BurnOptions {
  videoElement: HTMLVideoElement;
  segments: SubtitleSegment[];
  templateId: SubtitleTemplateId;
  fontSize: number;
  position: SubtitlePosition;
  syncOffset?: number;
  onProgress?: (progress: number, message: string) => void;
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
    try {
      const origWidth = videoElement.videoWidth || 720;
      const origHeight = videoElement.videoHeight || 1280;
      const duration = videoElement.duration || 8;

      // Create high-res canvas
      const canvas = document.createElement('canvas');
      canvas.width = origWidth;
      canvas.height = origHeight;
      const ctx = canvas.getContext('2d')!;

      // Setup audio capture stream safely
      let audioDest: MediaStreamAudioDestinationNode | null = null;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = (videoElement as any).__burnAudioCtx || new AudioCtx();
          (videoElement as any).__burnAudioCtx = audioCtx;

          if (!(videoElement as any).__burnAudioSource) {
            (videoElement as any).__burnAudioSource = audioCtx.createMediaElementSource(videoElement);
          }
          const source = (videoElement as any).__burnAudioSource;
          audioDest = audioCtx.createMediaStreamDestination();
          source.connect(audioDest);
          source.connect(audioCtx.destination);
        }
      } catch (audioErr) {
        console.warn('Audio capture stream fallback:', audioErr);
      }

      // Capture stream from canvas
      const canvasStream = canvas.captureStream ? canvas.captureStream(30) : (canvas as any).mozCaptureStream?.(30);
      if (!canvasStream) {
        throw new Error('Browser tidak mendukung perekaman kanvas video.');
      }

      // Add audio tracks if available
      if (audioDest && audioDest.stream.getAudioTracks().length > 0) {
        audioDest.stream.getAudioTracks().forEach((track) => canvasStream.addTrack(track));
      } else {
        const vStream = (videoElement as any).captureStream?.() || (videoElement as any).mozCaptureStream?.();
        if (vStream) {
          vStream.getAudioTracks().forEach((track: MediaStreamTrack) => canvasStream.addTrack(track));
        }
      }

      // Detect best supported mime type
      const candidateMimes = [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      let mimeType = 'video/webm';
      for (const candidate of candidateMimes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(candidate)) {
          mimeType = candidate;
          break;
        }
      }

      const isMp4 = mimeType.includes('mp4');
      const extension = isMp4 ? 'mp4' : 'webm';

      const recorder = new MediaRecorder(canvasStream, {
        mimeType,
        videoBitsPerSecond: 4000000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      // Important: Save previous video state
      const initialLoop = videoElement.loop;
      const initialMuted = videoElement.muted;
      const initialCurrentTime = videoElement.currentTime;

      // Disable loop so onended or completion fires properly
      videoElement.loop = false;
      videoElement.muted = false;
      videoElement.currentTime = 0;

      await new Promise<void>((r) => {
        let isDone = false;
        const done = () => {
          if (!isDone) {
            isDone = true;
            videoElement.removeEventListener('seeked', done);
            r();
          }
        };
        videoElement.addEventListener('seeked', done);
        setTimeout(done, 500); // safety fallback
      });

      let animationFrameId: number;
      let hasFinished = false;

      const finishRecording = () => {
        if (hasFinished) return;
        hasFinished = true;

        cancelAnimationFrame(animationFrameId);
        onProgress?.(100, 'Memproses file download...');

        // Restore video state
        videoElement.loop = initialLoop;
        videoElement.muted = initialMuted;
        videoElement.currentTime = initialCurrentTime;

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

      recorder.start(100);

      try {
        await videoElement.play();
      } catch (playErr) {
        // Fallback with muted play if browser blocks unmuted playback
        videoElement.muted = true;
        await videoElement.play();
      }

      function renderLoop() {
        if (hasFinished) return;

        const currentTime = videoElement.currentTime;
        const percent = Math.min(99, Math.round((currentTime / duration) * 100));
        onProgress?.(percent, `Menempelkan subtitle (${percent}%)...`);

        // Draw current video frame
        ctx.drawImage(videoElement, 0, 0, origWidth, origHeight);

        // Find active subtitle segment with sync offset and gap bridging
        const effectiveTime = Math.max(0, currentTime + syncOffset);
        const activeSeg = segments.find((s, index) => {
          const nextSeg = segments[index + 1];
          const maxEnd = nextSeg ? Math.min(nextSeg.start, s.end + 0.35) : s.end + 0.35;
          return effectiveTime >= s.start && effectiveTime < maxEnd;
        });

        if (activeSeg) {
          drawSubtitleOnCanvas(ctx, activeSeg, templateId, fontSize, position, origWidth, origHeight);
        }

        // Check if video reached the end
        if (videoElement.ended || currentTime >= duration - 0.08) {
          finishRecording();
          return;
        }

        animationFrameId = requestAnimationFrame(renderLoop);
      }

      renderLoop();

      videoElement.onended = () => {
        finishRecording();
      };

      // Hard safety timeout: duration + 3 seconds max
      setTimeout(() => {
        if (!hasFinished) {
          finishRecording();
        }
      }, (duration + 3) * 1000);

      videoElement.onerror = () => {
        cancelAnimationFrame(animationFrameId);
        if (recorder.state !== 'inactive') recorder.stop();
        reject(new Error('Gagal memutar video saat render.'));
      };
    } catch (err) {
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
  const scaledFontSize = Math.round(fontSize * scale * 1.25);

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
