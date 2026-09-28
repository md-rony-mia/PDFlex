import React, { useState } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  matchesCount: number;
  currentMatchIndex: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  matchesCount,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-18 right-6 z-40 bg-white rounded-xl shadow-xl border border-slate-200 p-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg text-slate-700">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          autoFocus
          placeholder="Find in document..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (e.shiftKey) onPrevMatch();
              else onNextMatch();
            }
            if (e.key === 'Escape') onClose();
          }}
          className="bg-transparent text-xs text-slate-900 outline-none w-44 font-medium"
        />
      </div>

      <div className="text-[11px] font-semibold text-slate-500 whitespace-nowrap min-w-[50px] text-center">
        {searchQuery ? `${matchesCount > 0 ? currentMatchIndex + 1 : 0} of ${matchesCount}` : '0 of 0'}
      </div>

      <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1">
        <button
          onClick={onPrevMatch}
          disabled={matchesCount === 0}
          title="Previous match (Shift+Enter)"
          className="p-1 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={onNextMatch}
          disabled={matchesCount === 0}
          title="Next match (Enter)"
          className="p-1 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={onClose}
        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        title="Close (Esc)"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
