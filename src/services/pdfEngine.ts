import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, degrees, StandardFonts, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import 'regenerator-runtime/runtime';
import { PageMeta, TextItemData, TextTokenInfo } from '../types/pdf';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const BANGLA_REGEX = /[\u0980-\u09FF]/;

export interface ExtractedPageData {
  meta: PageMeta;
  textItems: TextItemData[];
}

export interface LoadedPdfResult {
  pdfDocument: pdfjsLib.PDFDocumentProxy;
  totalPages: number;
  pagesData: ExtractedPageData[];
}

// Cached font buffers for pdf-lib export
let cachedBengaliFontBytes: ArrayBuffer | null = null;
let cachedRobotoFontBytes: ArrayBuffer | null = null;

async function getBengaliFontBytes(): Promise<Uint8Array> {
  if (!cachedBengaliFontBytes) {
    const res = await fetch('/fonts/NotoSansBengali-Regular.ttf');
    if (!res.ok) throw new Error('Failed to load Bengali font file');
    cachedBengaliFontBytes = await res.arrayBuffer();
  }
  return new Uint8Array(cachedBengaliFontBytes.slice(0));
}

async function getRobotoFontBytes(): Promise<Uint8Array> {
  if (!cachedRobotoFontBytes) {
    const res = await fetch('/fonts/Roboto-Regular.ttf');
    if (!res.ok) throw new Error('Failed to load Roboto font file');
    cachedRobotoFontBytes = await res.arrayBuffer();
  }
  return new Uint8Array(cachedRobotoFontBytes.slice(0));
}

export function detectIsBangla(text: string): boolean {
  return BANGLA_REGEX.test(text);
}

export function matchFont(fontName: string, text: string, styleFontFamily?: string): {
  family: string;
  isFallback: boolean;
  fallbackNote?: string;
  isBangla: boolean;
} {
  const isBangla = detectIsBangla(text);
  const rawCombined = `${fontName || ''} ${styleFontFamily || ''}`.toLowerCase();

  if (isBangla) {
    if (rawCombined.includes('solaiman')) {
      return { family: 'SolaimanLipi', isFallback: false, isBangla: true };
    }
    if (rawCombined.includes('kalpurush')) {
      return { family: 'Kalpurush', isFallback: false, isBangla: true };
    }
    if (rawCombined.includes('siliguri')) {
      return { family: 'Hind Siliguri', isFallback: false, isBangla: true };
    }
    if (rawCombined.includes('anek')) {
      return { family: 'Anek Bangla', isFallback: false, isBangla: true };
    }
    if (rawCombined.includes('bengali') || rawCombined.includes('noto')) {
      return { family: 'Noto Sans Bengali', isFallback: false, isBangla: true };
    }
    return {
      family: 'Noto Sans Bengali',
      isFallback: true,
      fallbackNote: 'Using Noto Sans Bengali fallback',
      isBangla: true,
    };
  }

  // 1. Monospace Check
  if (
    rawCombined.includes('courier') ||
    rawCombined.includes('mono') ||
    rawCombined.includes('consolas') ||
    rawCombined.includes('typewriter') ||
    rawCombined.includes('menlo')
  ) {
    return { family: 'Courier New', isFallback: false, isBangla: false };
  }

  // 2. Sans-Serif Check - CRITICAL: Check BEFORE serif because 'sans-serif' contains 'serif'!
  const isExplicitSans =
    rawCombined.includes('helvetica') ||
    rawCombined.includes('arial') ||
    rawCombined.includes('sans-serif') ||
    rawCombined.includes('sans') ||
    rawCombined.includes('calibri') ||
    rawCombined.includes('inter') ||
    rawCombined.includes('roboto') ||
    rawCombined.includes('tahoma') ||
    rawCombined.includes('verdana') ||
    rawCombined.includes('trebuchet') ||
    rawCombined.includes('segoe');

  if (isExplicitSans) {
    if (rawCombined.includes('helvetica')) {
      return { family: 'Helvetica', isFallback: false, isBangla: false };
    }
    if (rawCombined.includes('arial')) {
      return { family: 'Helvetica', isFallback: false, isBangla: false };
    }
    if (rawCombined.includes('calibri')) {
      return { family: 'Helvetica', isFallback: false, isBangla: false };
    }
    if (rawCombined.includes('inter')) {
      return { family: 'Inter', isFallback: false, isBangla: false };
    }
    return { family: 'Helvetica', isFallback: false, isBangla: false };
  }

  // 3. Serif Check
  // Strip 'sans-serif' and 'sans' completely to avoid false positive 'serif' substring match
  const stripped = rawCombined.replace(/sans-serif/g, '').replace(/sans/g, '');
  const isExplicitSerif =
    stripped.includes('times') ||
    stripped.includes('serif') ||
    stripped.includes('georgia') ||
    stripped.includes('cambria') ||
    stripped.includes('garamond') ||
    stripped.includes('palatino') ||
    stripped.includes('century') ||
    stripped.includes('baskerville') ||
    stripped.includes('bookman') ||
    stripped.includes('minion') ||
    (stripped.includes('roman') && !rawCombined.includes('helvetica') && !rawCombined.includes('arial'));

  if (isExplicitSerif) {
    return { family: 'Times New Roman', isFallback: false, isBangla: false };
  }

  // Default fallback for Latin text: standard web/PDF default is Helvetica
  return {
    family: 'Helvetica',
    isFallback: true,
    fallbackNote: 'Using standard Helvetica/Arial font (original font not embedded)',
    isBangla: false,
  };
}

/**
 * Loads a PDF document from ArrayBuffer with optional password.
 */
export async function loadPdfDocument(
  pdfBytes: ArrayBuffer | Uint8Array,
  password?: string
): Promise<pdfjsLib.PDFDocumentProxy> {
  // Always clone the buffer before passing to pdfjsLib,
  // because pdf.js transfers ArrayBuffers to its web worker which detaches them!
  let bufferToPass: Uint8Array;
  if (pdfBytes instanceof Uint8Array) {
    bufferToPass = new Uint8Array(pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength));
  } else {
    bufferToPass = new Uint8Array(pdfBytes.slice(0));
  }

  const loadingTask = pdfjsLib.getDocument({
    data: bufferToPass,
    password: password || '',
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  return await loadingTask.promise;
}

/**
 * Extracts text elements and dimensions for all pages.
 */
export async function extractAllPagesData(
  pdfDoc: pdfjsLib.PDFDocumentProxy
): Promise<ExtractedPageData[]> {
  const total = pdfDoc.numPages;
  const results: ExtractedPageData[] = [];

  for (let pageNum = 1; pageNum <= total; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });

    // Call getOperatorList to populate page.commonObjs with real FontFaceObjects
    try {
      await page.getOperatorList();
    } catch (e) {
      console.warn('Operator list retrieval failed for page', pageNum, e);
    }

    const textContent = await page.getTextContent();
    const rawItems: any[] = textContent.items.filter((item: any) => item.str && item.str.trim().length > 0);
    const styles = (textContent.styles || {}) as Record<string, any>;

    // Step 1: Sort items top-to-bottom, left-to-right
    const sorted = [...rawItems].sort((a, b) => {
      const diffY = b.transform[5] - a.transform[5];
      if (Math.abs(diffY) > 3) return diffY;
      return a.transform[4] - b.transform[4];
    });

    // Step 2: Merge items on the exact same baseline into single-line runs
    let currentGroup: any[] = [];
    const horizontalLines: TextItemData[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      if (currentGroup.length === 0) {
        currentGroup.push(item);
        continue;
      }

      const prev = currentGroup[currentGroup.length - 1];
      const sameBaseline = Math.abs(prev.transform[5] - item.transform[5]) < 3;
      const expectedNextX = prev.transform[4] + prev.width;
      const gap = item.transform[4] - expectedNextX;
      const fontSize = Math.hypot(item.transform[0], item.transform[1]) || item.height || 12;

      if (sameBaseline && gap >= -2 && gap < fontSize * 2.2) {
        currentGroup.push(item);
      } else {
        horizontalLines.push(createMergedTextItem(currentGroup, pageNum - 1, styles, page));
        currentGroup = [item];
      }
    }

    if (currentGroup.length > 0) {
      horizontalLines.push(createMergedTextItem(currentGroup, pageNum - 1, styles, page));
    }

    results.push({
      meta: {
        id: `page-${pageNum - 1}`,
        originalIndex: pageNum - 1,
        width: viewport.width,
        height: viewport.height,
        rotation: 0,
        isDeleted: false,
      },
      textItems: horizontalLines,
    });
  }

  return results;
}

function createMergedTextItem(
  items: any[],
  pageIndex: number,
  styles?: Record<string, any>,
  page?: any
): TextItemData {
  const first = items[0];
  const last = items[items.length - 1];

  let fullText = '';
  for (let i = 0; i < items.length; i++) {
    const cur = items[i];
    if (i > 0) {
      const prev = items[i - 1];
      const gap = cur.transform[4] - (prev.transform[4] + prev.width);
      if (gap > 2 && !fullText.endsWith(' ') && !cur.str.startsWith(' ')) {
        fullText += ' ';
      }
    }
    fullText += cur.str;
  }

  const pdfX = first.transform[4];
  const pdfY = first.transform[5];
  const pdfWidth = (last.transform[4] + last.width) - pdfX;
  const fontSize = Math.round(Math.hypot(first.transform[0], first.transform[1]) || first.height || 12);
  const pdfHeight = Math.max(fontSize, first.height || 12);

  let firstFontObj: any = null;
  try {
    if (page && (page as any).commonObjs && (page as any).commonObjs.has(first.fontName)) {
      firstFontObj = (page as any).commonObjs.get(first.fontName);
    }
  } catch (_) {}

  const styleObj = styles ? styles[first.fontName] : null;
  const styleFamily = styleObj?.fontFamily || '';
  const realFontName = firstFontObj?.name || first.fontName;
  const realFallback = firstFontObj?.fallbackName || styleFamily;
  const matched = matchFont(realFontName, fullText, realFallback);

  // Robust Bold, Italic and Token-level metadata detection across all tokens in this line
  let isBold = false;
  let isItalic = false;
  const tokens: TextTokenInfo[] = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const fn = it.fontName || '';
    const st = styles ? styles[fn] : null;
    const sf = st?.fontFamily || '';

    let fontObj: any = null;
    try {
      if (page && (page as any).commonObjs && (page as any).commonObjs.has(fn)) {
        fontObj = (page as any).commonObjs.get(fn);
      }
    } catch (_) {}

    const realFn = fontObj?.name || fn;
    const realFb = fontObj?.fallbackName || sf;
    const tokenMatched = matchFont(realFn, it.str, realFb);

    let tokenBold = false;
    let tokenItalic = false;

    // 1. Direct flags on PDF.js font object
    if (fontObj) {
      if (fontObj.bold || fontObj.black) tokenBold = true;
      if (fontObj.italic) tokenItalic = true;
      if (typeof fontObj.weight === 'string' && (fontObj.weight.toLowerCase().includes('bold') || ['600', '700', '800', '900'].includes(fontObj.weight))) {
        tokenBold = true;
      } else if (typeof fontObj.weight === 'number' && fontObj.weight >= 600) {
        tokenBold = true;
      }
    }

    // 2. Comprehensive string inspection across all font names/properties
    const fontStrings = [
      fn,
      sf,
      fontObj?.name,
      fontObj?.fallbackName,
      fontObj?.psName,
      fontObj?.loadedName
    ].filter(Boolean).join(' ').toLowerCase();

    // Bold indicators
    if (
      fontStrings.includes('bold') ||
      fontStrings.includes('black') ||
      fontStrings.includes('heavy') ||
      fontStrings.includes('demi') ||
      fontStrings.includes('semibold') ||
      fontStrings.includes('semi-bold') ||
      fontStrings.includes('-bd') ||
      fontStrings.includes('_bd') ||
      fontStrings.includes('-b') ||
      fontStrings.includes(',bold') ||
      fontStrings.includes(',b') ||
      /\b(w[6-9]|600|700|800|900)\b/.test(fontStrings)
    ) {
      tokenBold = true;
    }

    // Italic / Oblique indicators
    if (
      fontStrings.includes('italic') ||
      fontStrings.includes('oblique') ||
      fontStrings.includes('inclined') ||
      fontStrings.includes('slanted') ||
      fontStrings.includes('kursiv') ||
      fontStrings.includes('-it') ||
      fontStrings.includes('_it') ||
      fontStrings.includes('-obl') ||
      fontStrings.includes('_obl') ||
      fontStrings.includes(',italic') ||
      fontStrings.includes(',oblique') ||
      fontStrings.includes('-i') ||
      fontStrings.includes(',i')
    ) {
      tokenItalic = true;
    }

    if (tokenBold) isBold = true;
    if (tokenItalic) isItalic = true;

    const tokenFontSize = parseFloat((Math.hypot(it.transform[0], it.transform[1]) || it.height || fontSize).toFixed(1));

    let strToAdd = it.str;
    if (i > 0) {
      const prev = items[i - 1];
      const gap = it.transform[4] - (prev.transform[4] + prev.width);
      if (gap > 2 && !strToAdd.startsWith(' ')) {
        strToAdd = ' ' + strToAdd;
      }
    }

    tokens.push({
      text: strToAdd,
      fontFamily: tokenMatched.family,
      fontSize: tokenFontSize,
      bold: tokenBold,
      italic: tokenItalic,
      color: '#0f172a',
    });
  }

  return {
    id: `txt-${pageIndex}-${Math.round(pdfX)}-${Math.round(pdfY)}-${Math.random().toString(36).slice(2, 7)}`,
    originalText: fullText,
    currentText: fullText,
    pageIndex,
    pdfX,
    pdfY,
    pdfWidth: Math.max(pdfWidth, 15),
    pdfHeight,
    fontSize,
    originalFontSize: fontSize,
    fontFamily: matched.family,
    originalFontFamily: matched.family,
    isBangla: matched.isBangla,
    color: '#0f172a',
    originalColor: '#0f172a',
    bold: isBold,
    originalBold: isBold,
    italic: isItalic,
    originalItalic: isItalic,
    isModified: false,
    originalFontName: first.fontName || 'Unknown',
    isFallbackFont: matched.isFallback,
    fallbackNote: matched.fallbackNote,
    backgroundColor: '#ffffff',
    tokens,
  };
}

export function isItemModified(item: TextItemData): boolean {
  if (item.isDeleted) return true;
  if (item.isCustomAdded) return true;
  if (item.isModified) return true;
  if (item.currentText !== item.originalText) return true;
  if (item.originalFontSize !== undefined && item.fontSize !== item.originalFontSize) return true;
  if (item.originalFontFamily !== undefined && item.fontFamily !== item.originalFontFamily) return true;
  if (item.originalBold !== undefined && item.bold !== item.originalBold) return true;
  if (item.originalItalic !== undefined && item.italic !== item.originalItalic) return true;
  if (item.originalColor !== undefined && item.color !== item.originalColor) return true;
  return false;
}

export function parseHexColor(hex: string) {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) / 255;
    const g = parseInt(clean[1] + clean[1], 16) / 255;
    const b = parseInt(clean[2] + clean[2], 16) / 255;
    return rgb(r, g, b);
  }
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
}

/**
 * Exports modified PDF with whiteouts, replacement text, additions, and page modifications.
 */
export async function exportModifiedPdf(
  originalPdfBytes: ArrayBuffer | Uint8Array,
  pages: PageMeta[],
  textItemsMap: Record<string, TextItemData>
): Promise<Uint8Array> {
  // Ensure we have an independent, non-detached Uint8Array copy
  let safeBytes: Uint8Array;
  if (originalPdfBytes instanceof Uint8Array) {
    safeBytes = new Uint8Array(originalPdfBytes.buffer.slice(originalPdfBytes.byteOffset, originalPdfBytes.byteOffset + originalPdfBytes.byteLength));
  } else {
    safeBytes = new Uint8Array(originalPdfBytes.slice(0));
  }

  // Load original PDF
  const srcDoc = await PDFDocument.load(safeBytes, { ignoreEncryption: true });

  // Create new PDF to allow full reordering, rotations, and clean page manipulation
  const outDoc = await PDFDocument.create();
  outDoc.registerFontkit(fontkit);

  // Embed Custom Fonts
  const bengaliBytes = await getBengaliFontBytes();
  const robotoBytes = await getRobotoFontBytes();

  const bengaliFont = await outDoc.embedFont(bengaliBytes);
  const robotoFont = await outDoc.embedFont(robotoBytes);

  const helveticaFont = await outDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await outDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaObliqueFont = await outDoc.embedFont(StandardFonts.HelveticaOblique);
  const helveticaBoldObliqueFont = await outDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  const timesFont = await outDoc.embedFont(StandardFonts.TimesRoman);
  const timesBoldFont = await outDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalicFont = await outDoc.embedFont(StandardFonts.TimesRomanItalic);
  const timesBoldItalicFont = await outDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

  const courierFont = await outDoc.embedFont(StandardFonts.Courier);
  const courierBoldFont = await outDoc.embedFont(StandardFonts.CourierBold);
  const courierObliqueFont = await outDoc.embedFont(StandardFonts.CourierOblique);
  const courierBoldObliqueFont = await outDoc.embedFont(StandardFonts.CourierBoldOblique);

  // Group text items by page originalIndex
  const itemsByOriginalPage: Record<number, TextItemData[]> = {};
  Object.values(textItemsMap).forEach((item) => {
    if (!itemsByOriginalPage[item.pageIndex]) {
      itemsByOriginalPage[item.pageIndex] = [];
    }
    itemsByOriginalPage[item.pageIndex].push(item);
  });

  // Filter non-deleted pages in their new display order
  const activePages = pages.filter((p) => !p.isDeleted);

  for (let i = 0; i < activePages.length; i++) {
    const pageMeta = activePages[i];
    const originalIndex = pageMeta.originalIndex;

    // Copy original page
    const [copiedPage] = await outDoc.copyPages(srcDoc, [originalIndex]);
    
    // Apply rotation
    if (pageMeta.rotation !== 0) {
      const currentRotation = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((currentRotation + pageMeta.rotation) % 360));
    }

    const pageItems = itemsByOriginalPage[originalIndex] || [];

    // Process edits for this page
    for (const item of pageItems) {
      if (item.isDeleted) {
        // Redact / erase the original text with tight bounding box
        copiedPage.drawRectangle({
          x: item.pdfX - 1,
          y: item.pdfY - 1,
          width: item.pdfWidth + 2,
          height: item.pdfHeight + 2,
          color: parseHexColor(item.backgroundColor || '#ffffff'),
        });
        continue;
      }

      if (!isItemModified(item)) {
        // Untouched original text: left 100% as vector in the original PDF!
        continue;
      }

      // ONLY actually modified items reach here!
      // If user provided explicit newlines (\n), draw each line.
      // Otherwise keep single line as entered without artificial word-wrapping!
      const textLines = item.currentText.split('\n');
      const totalLines = textLines.length;
      const lineHeight = Math.max(item.fontSize * 1.25, item.pdfHeight);
      const totalCoverHeight = totalLines <= 1 ? (item.pdfHeight || item.fontSize) : totalLines * lineHeight;

      // If it is an edited existing item, first cover the original text with a clean background box
      if (!item.isCustomAdded) {
        copiedPage.drawRectangle({
          x: item.pdfX - 1,
          y: item.pdfY - (totalLines - 1) * lineHeight - 1,
          width: Math.max(item.pdfWidth, 15) + 2,
          height: totalCoverHeight + 2,
          color: parseHexColor(item.backgroundColor || '#ffffff'),
        });
      }

      // Choose font based on content & family & bold/italic style
      const hasBangla = detectIsBangla(item.currentText);
      let chosenFont: PDFFont = helveticaFont;

      if (hasBangla) {
        chosenFont = bengaliFont;
      } else if (item.fontFamily === 'Times New Roman') {
        if (item.bold && item.italic) chosenFont = timesBoldItalicFont;
        else if (item.bold) chosenFont = timesBoldFont;
        else if (item.italic) chosenFont = timesItalicFont;
        else chosenFont = timesFont;
      } else if (item.fontFamily === 'Courier New') {
        if (item.bold && item.italic) chosenFont = courierBoldObliqueFont;
        else if (item.bold) chosenFont = courierBoldFont;
        else if (item.italic) chosenFont = courierObliqueFont;
        else chosenFont = courierFont;
      } else {
        // Helvetica / Arial / Inter
        if (item.bold && item.italic) chosenFont = helveticaBoldObliqueFont;
        else if (item.bold) chosenFont = helveticaBoldFont;
        else if (item.italic) chosenFont = helveticaObliqueFont;
        else chosenFont = helveticaFont;
      }

      for (let lineIdx = 0; lineIdx < textLines.length; lineIdx++) {
        const lineText = textLines[lineIdx];
        const lineY = item.pdfY - lineIdx * lineHeight;

        try {
          copiedPage.drawText(lineText, {
            x: item.pdfX,
            y: lineY,
            size: Math.max(item.fontSize, 6),
            font: chosenFont,
            color: parseHexColor(item.color || '#000000'),
          });
        } catch (err) {
          try {
            copiedPage.drawText(lineText, {
              x: item.pdfX,
              y: lineY,
              size: Math.max(item.fontSize, 6),
              font: helveticaFont,
              color: parseHexColor(item.color || '#000000'),
            });
          } catch (innerErr) {
            console.error('Failed to draw text line:', lineText, innerErr);
          }
        }
      }
    }

    outDoc.addPage(copiedPage);
  }

  return await outDoc.save();
}
