import React from 'react';
import {
  Bold,
  Italic,
  Trash2,
  RotateCcw,
  Sparkles,
  Info,
  Type,
  Palette,
  Minus,
  Plus,
  X,
  Languages
} from 'lucide-react';
import { TextItemData, SUPPORTED_FONTS } from '../types/pdf';

interface TextFormatToolbarProps {
  selectedItem: TextItemData | null;
  onUpdateItem: (updated: Partial<TextItemData>) => void;
  onDeleteItem: (id: string) => void;
  onResetItem: (id: string) => void;
  onDeselect: () => void;
}

const PRESET_COLORS = [
  { label: 'Deep Slate', hex: '#0f172a' },
  { label: 'Black', hex: '#000000' },
  { label: 'Navy Blue', hex: '#1e3a8a' },
  { label: 'Royal Blue', hex: '#2563eb' },
  { label: 'Crimson Red', hex: '#dc2626' },
  { label: 'Emerald Green', hex: '#059669' },
  { label: 'Amber', hex: '#d97706' },
  { label: 'Purple', hex: '#7c3aed' },
];

export const TextFormatToolbar: React.FC<TextFormatToolbarProps> = ({
  selectedItem,
  onUpdateItem,
  onDeleteItem,
  onResetItem,
  onDeselect,
}) => {
  if (!selectedItem) return null;

  const isModified =
    selectedItem.currentText !== selectedItem.originalText ||
    selectedItem.fontSize !== 12 ||
    selectedItem.bold ||
    selectedItem.italic ||
    selectedItem.color !== '#0f172a';

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-3 text-slate-100 flex flex-wrap items-center gap-3 transition-all animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Font Family Picker */}
      <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700/60">
        <Languages className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <select
          value={selectedItem.fontFamily}
          onChange={(e) => onUpdateItem({ fontFamily: e.target.value })}
          className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
        >
          <optgroup label="Bangla Fonts (বাংলা)">
            {SUPPORTED_FONTS.filter((f) => f.isBangla).map((f) => (
              <option key={f.id} value={f.family} className="bg-slate-900 text-white">
                {f.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Standard Latin Fonts">
            {SUPPORTED_FONTS.filter((f) => !f.isBangla).map((f) => (
              <option key={f.id} value={f.family} className="bg-slate-900 text-white">
                {f.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Font Size */}
      <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700/60">
        <button
          onClick={() => onUpdateItem({ fontSize: Math.max(6, selectedItem.fontSize - 1) })}
          title="Decrease font size"
          className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-semibold px-1 w-6 text-center text-slate-200">
          {selectedItem.fontSize}
        </span>
        <button
          onClick={() => onUpdateItem({ fontSize: Math.min(96, selectedItem.fontSize + 1) })}
          title="Increase font size"
          className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bold / Italic */}
      <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60">
        <button
          onClick={() => onUpdateItem({ bold: !selectedItem.bold })}
          className={`p-1.5 rounded-lg transition ${
            selectedItem.bold
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
          }`}
          title="Bold text"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onUpdateItem({ italic: !selectedItem.italic })}
          className={`p-1.5 rounded-lg transition ${
            selectedItem.italic
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
          }`}
          title="Italic text"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Text Color */}
      <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700/60">
        <Palette className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <div className="flex items-center gap-1">
          {PRESET_COLORS.slice(0, 4).map((c) => (
            <button
              key={c.hex}
              onClick={() => onUpdateItem({ color: c.hex })}
              title={c.label}
              className={`w-4 h-4 rounded-full border transition ${
                selectedItem.color.toLowerCase() === c.hex.toLowerCase()
                  ? 'border-indigo-400 ring-2 ring-indigo-500/40 scale-110'
                  : 'border-slate-600 hover:scale-105'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
          <input
            type="color"
            value={selectedItem.color}
            onChange={(e) => onUpdateItem({ color: e.target.value })}
            className="w-5 h-5 rounded-full cursor-pointer bg-transparent border-0 p-0 overflow-hidden"
            title="Custom Color"
          />
        </div>
      </div>

      {/* Reset to Original if changed */}
      {isModified && !selectedItem.isCustomAdded && (
        <button
          onClick={() => onResetItem(selectedItem.id)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 rounded-xl border border-amber-400/20 transition"
          title="Reset to original text from PDF"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      )}

      {/* Delete / Remove Text */}
      <button
        onClick={() => onDeleteItem(selectedItem.id)}
        className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded-xl border border-rose-400/20 transition"
        title="Delete text element"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Erase</span>
      </button>

      {/* Fallback Font Indicator */}
      {selectedItem.isFallbackFont && (
        <div className="flex items-center gap-1 text-[11px] text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
          <Info className="w-3 h-3 shrink-0" />
          <span className="truncate max-w-[180px]">Similar font matched</span>
        </div>
      )}

      {/* Close button */}
      <button
        onClick={onDeselect}
        className="ml-auto p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        title="Done formatting"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
