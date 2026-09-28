import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Lock,
  RotateCw,
  Edit,
  Languages,
  HelpCircle,
  FileCheck
} from 'lucide-react';

interface LandingDropzoneProps {
  onFileSelected: (file: File) => void;
  onLoadSample: (samplePath: string, sampleName: string) => void;
  onOpenDocGuide: () => void;
  isLoading: boolean;
  loadingMessage?: string;
}

export const LandingDropzone: React.FC<LandingDropzoneProps> = ({
  onFileSelected,
  onLoadSample,
  onOpenDocGuide,
  isLoading,
  loadingMessage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        onFileSelected(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelected(files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Edit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white">PDFlex</span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">
                100% Free
              </span>
            </div>
            <p className="text-xs text-slate-400">In-Browser PDF Text Editor</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onOpenDocGuide}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700/60 transition"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>Compatibility & QA Guide</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto w-full px-6 py-8 flex-1 flex flex-col items-center justify-center text-center">
        {/* Trust Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold mb-6 shadow-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Your file never leaves your browser — 100% Client-Side Processing</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-2xl">
          Edit PDF text in seconds. <br />
          <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
            No watermark. No limits.
          </span>
        </h1>

        <p className="mt-4 text-base md:text-lg text-slate-300 max-w-xl leading-relaxed">
          Click on any existing text block to modify it in place, insert new text, or manage pages. Native support for English and Bangla.
        </p>

        {/* Drag & Drop Hero Box */}
        <div className="mt-8 w-full max-w-2xl">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="application/pdf"
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-3xl border-2 border-dashed p-10 md:p-14 cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center ${
              isDragOver
                ? 'border-indigo-400 bg-indigo-600/15 scale-[1.01] shadow-2xl shadow-indigo-500/20'
                : 'border-slate-700/80 bg-slate-900/60 hover:border-indigo-500/70 hover:bg-slate-900/90 shadow-xl'
            }`}
          >
            {isLoading ? (
              <div className="flex flex-col items-center py-6">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-4" />
                <p className="text-base font-medium text-white">{loadingMessage || 'Processing PDF...'}</p>
                <p className="text-xs text-slate-400 mt-1">Reading text coordinates and font dictionary...</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition duration-200 shadow-md">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <div className="mt-5 space-y-1">
                  <p className="text-lg font-bold text-white">
                    Drag and drop your PDF here
                  </p>
                  <p className="text-xs text-slate-400">
                    or <span className="text-indigo-400 font-semibold underline underline-offset-2">browse files</span> on your device
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> No size or page count limits
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Password-protected PDFs supported
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Zero upload to any server
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Sample Selector */}
        <div className="mt-10 w-full max-w-2xl text-left bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Try with a sample document:
            </span>
            <span className="text-[11px] text-slate-500">Instant 1-Click Load</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Sample 1: English Invoice */}
            <button
              onClick={() => onLoadSample('/samples/invoice-sample.pdf', 'invoice-sample.pdf')}
              className="flex flex-col text-left p-3 rounded-xl bg-slate-800/50 hover:bg-indigo-600/15 border border-slate-700/60 hover:border-indigo-500/60 transition group"
            >
              <div className="flex items-center justify-between text-indigo-400 mb-1">
                <FileText className="w-4 h-4" />
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
              </div>
              <span className="text-xs font-semibold text-white">Business Invoice</span>
              <span className="text-[11px] text-slate-400 mt-0.5">English tables & billing lines</span>
            </button>

            {/* Sample 2: Bangla Certificate */}
            <button
              onClick={() => onLoadSample('/samples/bangla-certificate-sample.pdf', 'bangla-certificate-sample.pdf')}
              className="flex flex-col text-left p-3 rounded-xl bg-slate-800/50 hover:bg-indigo-600/15 border border-slate-700/60 hover:border-indigo-500/60 transition group"
            >
              <div className="flex items-center justify-between text-emerald-400 mb-1">
                <Languages className="w-4 h-4" />
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
              </div>
              <span className="text-xs font-semibold text-white">বাংলা সনদপত্র (Certificate)</span>
              <span className="text-[11px] text-slate-400 mt-0.5">যুক্তাক্ষর ও বাংলা ফন্ট পরীক্ষা</span>
            </button>

            {/* Sample 3: Bilingual Letter */}
            <button
              onClick={() => onLoadSample('/samples/bilingual-official-letter.pdf', 'bilingual-official-letter.pdf')}
              className="flex flex-col text-left p-3 rounded-xl bg-slate-800/50 hover:bg-indigo-600/15 border border-slate-700/60 hover:border-indigo-500/60 transition group"
            >
              <div className="flex items-center justify-between text-amber-400 mb-1">
                <FileCheck className="w-4 h-4" />
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
              </div>
              <span className="text-xs font-semibold text-white">Bilingual Official Letter</span>
              <span className="text-[11px] text-slate-400 mt-0.5">English & Bangla mixed runs</span>
            </button>
          </div>
        </div>

        {/* Scope Transparency Section */}
        <div className="mt-8 text-xs text-slate-400 max-w-xl">
          <p>
            <strong className="text-slate-300">Works best with:</strong> Standard documents with native text layers (invoices, receipts, letters, certificates, and single-column forms). Scanned image PDFs without text layers require OCR first.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800/60 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          PDFlex — 100% Free Client-Side PDF Text Editor. Zero analytics, zero data collection.
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onOpenDocGuide} className="hover:text-slate-300 underline underline-offset-2">
            Scope & Compatibility Guide
          </button>
        </div>
      </footer>
    </div>
  );
};
