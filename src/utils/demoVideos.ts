export interface DemoPreset {
  id: string;
  title: string;
  tag: string;
  duration: number;
  description: string;
  script: string;
  videoPath: string;
}

// Relative paths work universally on both custom subpaths (like GitHub Pages /Video-konten/) and root domains
const base = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : './';
const cleanBase = base.endsWith('/') ? base : `${base}/`;

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'creator-vlog',
    title: 'Creator Vlog: 3 Tips Konten Viral',
    tag: 'Trending',
    duration: 8,
    description: 'Video vertikal ala kreator membahas trik hook 3 detik pertama agar video Shorts auto viral.',
    script: 'Hai kreator! Ini tiga trik hook ampuh agar video Shorts kamu cepat viral dan banjir penonton.',
    videoPath: `${cleanBase}demo/creator-vlog.mp4`,
  },
  {
    id: 'tech-review',
    title: 'Tech Review: Tools AI Subtitle',
    tag: 'Teknologi',
    duration: 7,
    description: 'Review cepat aplikasi produktivitas dan AI translation untuk konten video vertikal.',
    script: 'Aplikasi AI ini bisa menerjemahkan video otomatis dan menempelkan subtitle keren dalam hitungan detik.',
    videoPath: `${cleanBase}demo/tech-review.mp4`,
  },
  {
    id: 'kuliner-aesthetic',
    title: 'Street Food: Hidden Gem Viral',
    tag: 'Lifestyle',
    duration: 7,
    description: 'Cuplikan video vertikal tempat makan aesthetic yang lagi ramai di media sosial.',
    script: 'Akhirnya nemuin kuliner hidden gem paling enak di kota ini. Rasanya lezat dan porsinya puas.',
    videoPath: `${cleanBase}demo/kuliner-aesthetic.mp4`,
  },
];

/**
 * Loads the pre-rendered demo MP4 video instantly without waiting.
 */
export async function loadDemoVideo(preset: DemoPreset): Promise<{
  blob: Blob;
  url: string;
}> {
  try {
    const res = await fetch(preset.videoPath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    return { blob, url };
  } catch (err) {
    // Return direct path as fallback
    return {
      blob: new Blob([], { type: 'video/mp4' }),
      url: preset.videoPath,
    };
  }
}
