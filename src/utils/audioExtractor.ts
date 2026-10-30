/**
 * Extracts and downsamples audio from a video Blob/File into 16kHz mono WAV format (base64)
 * for accurate transcription by Gemini AI.
 */

export async function extractAudioFromVideo(
  videoBlob: Blob,
  maxDurationSeconds = 60
): Promise<{ audioBase64: string; mimeType: string } | null> {
  const timeoutPromise = new Promise<{ audioBase64: string; mimeType: string } | null>((resolve) => {
    setTimeout(() => {
      console.warn('Audio extraction timed out after 12s, proceeding with fallback.');
      resolve(null);
    }, 12000);
  });

  const extractionPromise = (async (): Promise<{ audioBase64: string; mimeType: string } | null> => {
    try {
      // Decode the full arrayBuffer (up to 40MB) without slicing to avoid corrupting MP4 headers
      if (videoBlob.size > 40 * 1024 * 1024) {
        console.warn('Video file too large for in-browser audio extraction (>40MB)');
        return null;
      }

      const arrayBuffer = await videoBlob.arrayBuffer();

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        return null;
      }

      const audioCtx = new AudioCtxClass();
      let audioBuffer: AudioBuffer;

      try {
        audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      } catch (decodeErr) {
        console.warn('decodeAudioData failed:', decodeErr);
        await audioCtx.close();
        return null;
      }

      const targetSampleRate = 16000;
      const durationToProcess = Math.min(audioBuffer.duration, maxDurationSeconds);
      const targetLength = Math.floor(durationToProcess * targetSampleRate);

      if (targetLength <= 0) {
        await audioCtx.close();
        return null;
      }

      const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineCtx.destination);
      source.start(0);

      const renderedBuffer = await offlineCtx.startRendering();
      await audioCtx.close();

      const wavBytes = encodeWAV(renderedBuffer.getChannelData(0), targetSampleRate);
      const base64Audio = uint8ArrayToBase64(wavBytes);

      return {
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
      };
    } catch (err) {
      console.warn('Non-fatal error during audio extraction:', err);
      return null;
    }
  })();

  return Promise.race([extractionPromise, timeoutPromise]);
}

function encodeWAV(samples: Float32Array, sampleRate: number): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
