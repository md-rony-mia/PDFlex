import React from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, Languages, Lock, Layers } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 md:p-8 text-slate-100 my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>PDFlex Compatibility & Architecture Guide</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Phase 5 QA Pass findings & transparent document support matrix
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-6 text-sm text-slate-300">
          {/* Privacy Guarantee */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-emerald-200">100% Client-Side Privacy</h4>
              <p className="text-xs mt-1 text-emerald-300/90 leading-relaxed">
                Your PDF file is processed entirely in your web browser's local memory using Mozilla's pdf.js and pdf-lib. No document data or text is ever sent or stored on any remote server.
              </p>
            </div>
          </div>

          {/* Supported Document Matrix */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Document Compatibility Matrix
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Fully Supported (Best Results)
                </span>
                <ul className="text-xs space-y-1.5 text-slate-300 list-disc list-inside">
                  <li>Invoices, receipts, and billing statements</li>
                  <li>Official letters, notices, and memos</li>
                  <li>Academic & training certificates</li>
                  <li>Single/simple column forms and contracts</li>
                  <li>PDFs exported from Word, Google Docs, LibreOffice</li>
                  <li>Password-protected encrypted PDFs</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Out of Scope for V1
                </span>
                <ul className="text-xs space-y-1.5 text-slate-300 list-disc list-inside">
                  <li>Scanned bitmap images without a native text layer (requires OCR tool first)</li>
                  <li>Multi-column magazine layouts requiring automatic paragraph flow across columns</li>
                  <li>PDF form interactive fillable acro-forms (use direct text edit instead)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bangla & Complex Scripts */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-2">
              <Languages className="w-4 h-4 text-indigo-400" />
              Bangla Language & Complex Conjuncts (যুক্তাক্ষর)
            </h3>
            <p className="text-xs leading-relaxed text-slate-300">
              PDFlex bundles high quality OpenType/TrueType Unicode fonts including <strong>Noto Sans Bengali</strong>, <strong>Hind Siliguri</strong>, <strong>Anek Bangla</strong>, <strong>SolaimanLipi</strong>, and <strong>Kalpurush</strong>. Complex Indic conjuncts like ক্ত, ক্ষ, জ্ঞ, ঙ্ক, ঙ্গ, ঞ্চ, ঞ্ছ, ঞ্জ, ণ্ড, ণ্ঠ, ণ্ট, ণ্ণ are fully shaped and embedded into the exported PDF using Fontkit's OpenType layout engine.
            </p>
          </div>

          {/* How In-Place Editing Works */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-2">
              How In-Place Editing & Export Works
            </h3>
            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>When you click a text block, PDFlex identifies its exact page baseline and coordinates.</li>
              <li>You can modify the text, font size, bold/italic style, and color.</li>
              <li>During export, a precise background whiteout box covers the original text run, and the replacement text is drawn in vector form with embedded Unicode fonts.</li>
              <li>Untouched vector lines, images, tables, and borders remain 100% intact with zero degradation.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
