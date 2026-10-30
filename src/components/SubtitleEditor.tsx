import React from 'react';
import { Plus, Trash2, Clock, FileText, Download, Play } from 'lucide-react';
import { SubtitleSegment } from '../types';
import { downloadTextFile, generateSRT, generateVTT } from '../utils/subtitleFormatters';

interface SubtitleEditorProps {
  segments: SubtitleSegment[];
  onSegmentsChange: (segments: SubtitleSegment[]) => void;
  onSeek: (seconds: number) => void;
  currentTime: number;
}

export const SubtitleEditor: React.FC<SubtitleEditorProps> = ({
  segments,
  onSegmentsChange,
  onSeek,
  currentTime,
}) => {
  const handleUpdate = (id: string, field: keyof SubtitleSegment, value: any) => {
    const updated = segments.map((seg) => {
      if (seg.id === id) {
        return { ...seg, [field]: value };
      }
      return seg;
    });
    onSegmentsChange(updated);
  };

  const handleAddSegment = () => {
    const lastSeg = segments[segments.length - 1];
    const newStart = lastSeg ? Number((lastSeg.end + 0.1).toFixed(2)) : 0;
    const newEnd = Number((newStart + 2.0).toFixed(2));

    const newSeg: SubtitleSegment = {
      id: `seg-${Date.now()}`,
      start: newStart,
      end: newEnd,
      originalText: 'Teks asli baru...',
      translatedText: 'Teks terjemahan baru...',
    };
    onSegmentsChange([...segments, newSeg]);
  };

  const handleDeleteSegment = (id: string) => {
    onSegmentsChange(segments.filter((s) => s.id !== id));
  };

  const handleExportSRT = () => {
    const content = generateSRT(segments);
    downloadTextFile(content, 'subtitles.srt', 'text/plain');
  };

  const handleExportVTT = () => {
    const content = generateVTT(segments);
    downloadTextFile(content, 'subtitles.vtt', 'text/vtt');
  };

  const handleShiftAll = (delta: number) => {
    const updated = segments.map((seg) => ({
      ...seg,
      start: Math.max(0, Number((seg.start + delta).toFixed(2))),
      end: Math.max(0.5, Number((seg.end + delta).toFixed(2))),
    }));
    onSegmentsChange(updated);
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-white/10">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5 text-purple-400" />
          <span>Segmen Subtitle ({segments.length})</span>
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 text-xs">
            <span className="text-[10px] text-slate-400 font-semibold px-1">Geser:</span>
            <button
              type="button"
              onClick={() => handleShiftAll(-0.3)}
              className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-mono cursor-pointer"
              title="Mundurkan semua 0.3s"
            >
              -0.3s
            </button>
            <button
              type="button"
              onClick={() => handleShiftAll(0.3)}
              className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-mono cursor-pointer"
              title="Majukan semua 0.3s"
            >
              +0.3s
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddSegment}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600/30 text-purple-200 border border-purple-500/40 hover:bg-purple-600/50 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Baris</span>
          </button>
          <button
            type="button"
            onClick={handleExportSRT}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition cursor-pointer"
            title="Download file SRT"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.SRT</span>
          </button>
          <button
            type="button"
            onClick={handleExportVTT}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition cursor-pointer"
            title="Download file VTT"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.VTT</span>
          </button>
        </div>
      </div>

      {/* Segments List */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {segments.map((seg, idx) => {
          const isActive = currentTime >= seg.start && currentTime <= seg.end;

          return (
            <div
              key={seg.id}
              className={`p-3 rounded-xl border transition ${
                isActive
                  ? 'bg-purple-950/40 border-purple-400/80 shadow-md ring-1 ring-purple-500/30'
                  : 'bg-black/25 border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSeek(seg.start)}
                    className="w-6 h-6 rounded-md bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white flex items-center justify-center transition cursor-pointer"
                    title="Putar segmen ini"
                  >
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    #{idx + 1}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                    <Clock className="w-3 h-3 text-purple-400" />
                    <input
                      type="number"
                      step="0.1"
                      value={seg.start}
                      onChange={(e) => handleUpdate(seg.id, 'start', Number(e.target.value))}
                      className="w-12 bg-transparent text-right outline-none font-mono"
                    />
                    <span>s –</span>
                    <input
                      type="number"
                      step="0.1"
                      value={seg.end}
                      onChange={(e) => handleUpdate(seg.id, 'end', Number(e.target.value))}
                      className="w-12 bg-transparent text-right outline-none font-mono"
                    />
                    <span>s</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteSegment(seg.id)}
                  className="p-1 text-slate-500 hover:text-red-400 transition cursor-pointer"
                  title="Hapus baris"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Text Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                    Teks Asli
                  </label>
                  <input
                    type="text"
                    value={seg.originalText}
                    onChange={(e) => handleUpdate(seg.id, 'originalText', e.target.value)}
                    className="w-full bg-slate-900/90 text-slate-300 rounded-lg px-2.5 py-1.5 border border-white/10 focus:border-purple-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-purple-300 font-semibold block mb-0.5">
                    Hasil Terjemahan (Tampil di Video)
                  </label>
                  <input
                    type="text"
                    value={seg.translatedText}
                    onChange={(e) => handleUpdate(seg.id, 'translatedText', e.target.value)}
                    className="w-full bg-slate-900 text-white font-medium rounded-lg px-2.5 py-1.5 border border-purple-500/40 focus:border-purple-400 outline-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
