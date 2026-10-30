export type SubtitleTemplateId =
  | 'clean'
  | 'bold'
  | 'neon'
  | 'cinema'
  | 'pink'
  | 'creator'
  | 'minimal'
  | 'outline'
  | 'gradient'
  | 'shadow'
  | 'karaoke'
  | 'highlight';

export type SubtitlePosition = 'bottom' | 'middle' | 'top';

export type TemplateCategory = 'Semua' | 'Viral' | 'Modern' | 'Minimal' | 'Konten';

export interface SubtitleSegment {
  id: string;
  start: number;
  end: number;
  originalText: string;
  translatedText: string;
  highlightWord?: string;
}

export interface SubtitleTemplateInfo {
  id: SubtitleTemplateId;
  name: string;
  category: TemplateCategory;
  desc: string;
  cssClass: string;
  previewBg: string;
  textColor: string;
  hasHighlight?: boolean;
}

export interface VideoMetadata {
  file?: File;
  url: string;
  name: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  isDemo?: boolean;
  script?: string;
  presetId?: string;
}

export interface TranslationResult {
  segments: SubtitleSegment[];
  detectedLanguage: string;
  targetLanguage: string;
  title: string;
  description: string;
  hashtags: string;
  message?: string;
}
