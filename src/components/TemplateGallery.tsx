import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { SUBTITLE_TEMPLATES } from '../data/templates';
import { SubtitleTemplateId, TemplateCategory } from '../types';

interface TemplateGalleryProps {
  selectedTemplate: SubtitleTemplateId;
  onSelectTemplate: (templateId: SubtitleTemplateId) => void;
  fontSize: number;
}

const CATEGORIES: TemplateCategory[] = ['Semua', 'Viral', 'Modern', 'Minimal', 'Konten'];

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  selectedTemplate,
  onSelectTemplate,
  fontSize,
}) => {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('Semua');

  const filteredTemplates = SUBTITLE_TEMPLATES.filter((tpl) => {
    if (activeCategory === 'Semua') return true;
    return tpl.category === activeCategory;
  });

  // Calculate preview font size
  const previewFontSize = Math.max(13, Math.round(fontSize * 0.42));

  return (
    <div className="space-y-3 pt-2">
      {/* Title & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
          <span>Gaya Subtitle</span>
        </h3>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {filteredTemplates.map((tpl) => {
          const isSelected = selectedTemplate === tpl.id;

          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelectTemplate(tpl.id)}
              className={`relative group rounded-2xl p-2 text-left transition-all duration-200 border cursor-pointer ${
                isSelected
                  ? 'bg-purple-950/40 border-purple-400 ring-2 ring-purple-500/40 shadow-lg shadow-purple-950/50 scale-[1.02]'
                  : 'bg-slate-900/60 border-white/10 hover:border-purple-400/50 hover:bg-slate-900/90'
              }`}
            >
              {/* Checkmark indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 z-10 w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-md">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {/* Preview Box */}
              <div
                className={`relative h-20 rounded-xl bg-gradient-to-br ${tpl.previewBg} p-2 flex items-center justify-center text-center overflow-hidden border border-white/10`}
              >
                {/* Subtle vignette & light sheen */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

                <span
                  className={`relative z-10 leading-tight block ${tpl.cssClass}`}
                  style={{ fontSize: `${previewFontSize}px` }}
                >
                  {tpl.hasHighlight ? (
                    <>
                      Ini contoh
                      <br />
                      <span className="text-red-500 font-black">subtitle video</span>
                    </>
                  ) : (
                    <>
                      Ini contoh
                      <br />
                      subtitle video
                    </>
                  )}
                </span>
              </div>

              {/* Template Label */}
              <div className="mt-2 px-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">
                    {tpl.name}
                  </span>
                  <span className="text-[10px] text-purple-300 font-medium">
                    {tpl.category}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {tpl.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
