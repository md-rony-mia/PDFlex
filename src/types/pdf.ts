export interface TextTokenInfo {
  text: string;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  color: string;
}

export interface TextItemData {
  id: string;
  originalText: string;
  currentText: string;
  pageIndex: number;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  fontSize: number;
  originalFontSize?: number;
  fontFamily: string;
  originalFontFamily?: string;
  isBangla: boolean;
  color: string; // hex
  originalColor?: string;
  bold: boolean;
  originalBold?: boolean;
  italic: boolean;
  originalItalic?: boolean;
  isModified?: boolean;
  isCustomAdded?: boolean;
  isDeleted?: boolean;
  originalFontName: string;
  isFallbackFont: boolean;
  fallbackNote?: string;
  backgroundColor?: string; // whiteout color, default '#ffffff'
  tokens?: TextTokenInfo[];
}

export interface PageMeta {
  id: string;
  originalIndex: number;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
  isDeleted: boolean;
}

export interface EditHistoryItem {
  id: string;
  timestamp: number;
  description: string;
  pages: PageMeta[];
  textItems: Record<string, TextItemData>; // key: id
}

export type ZoomMode = 'fit-width' | 'fit-page' | number;

export interface SupportedFont {
  id: string;
  name: string;
  family: string;
  isBangla: boolean;
  cssFont: string;
}

export const SUPPORTED_FONTS: SupportedFont[] = [
  // Bangla & Multilingual
  { id: 'noto-sans-bengali', name: 'Noto Sans Bengali (বাংলা)', family: 'Noto Sans Bengali', isBangla: true, cssFont: "'Noto Sans Bengali', sans-serif" },
  { id: 'hind-siliguri', name: 'Hind Siliguri (বাংলা)', family: 'Hind Siliguri', isBangla: true, cssFont: "'Hind Siliguri', sans-serif" },
  { id: 'anek-bangla', name: 'Anek Bangla (বাংলা)', family: 'Anek Bangla', isBangla: true, cssFont: "'Anek Bangla', sans-serif" },
  { id: 'solaiman-lipi', name: 'SolaimanLipi (বাংলা)', family: 'SolaimanLipi', isBangla: true, cssFont: "'SolaimanLipi', 'Noto Sans Bengali', sans-serif" },
  { id: 'kalpurush', name: 'Kalpurush (বাংলা)', family: 'Kalpurush', isBangla: true, cssFont: "'Kalpurush', 'Noto Sans Bengali', sans-serif" },

  // Latin Standard
  { id: 'helvetica', name: 'Helvetica / Arial (Sans-serif)', family: 'Helvetica', isBangla: false, cssFont: "Helvetica, Arial, sans-serif" },
  { id: 'times', name: 'Times New Roman (Serif)', family: 'Times New Roman', isBangla: false, cssFont: "'Times New Roman', Times, Georgia, serif" },
  { id: 'courier', name: 'Courier New (Monospace)', family: 'Courier New', isBangla: false, cssFont: "'Courier New', Courier, monospace" },
  { id: 'inter', name: 'Inter (Sans-serif)', family: 'Inter', isBangla: false, cssFont: "'Inter', sans-serif" },
];
