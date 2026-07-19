import { parsePdfBytes } from "../../shared/pdfParse";

/**
 * True when Chrome's built-in PDF viewer has taken over this tab. Our content
 * script still gets injected into the outer document even though the PDF's
 * own rendered content lives inside that separate built-in viewer extension
 * (which we have no DOM access to) — hence extracting text ourselves below
 * rather than trying to read it off the page.
 */
export function isPdfDocument(): boolean {
  return document.contentType === "application/pdf";
}

/**
 * Local PDFs can't be fetched by any extension context (content script,
 * background, sidebar) unless the user has manually flipped "Allow access to
 * file URLs" in chrome://extensions — there's no programmatic way to request
 * that. Rather than asking users to find and flip a security-sensitive
 * toggle, the sidebar offers a file-picker upload instead (see localPdfName
 * handling in extractPage.ts / App.tsx), which needs no special permission.
 */
export function isLocalPdf(): boolean {
  return isPdfDocument() && location.protocol === "file:";
}

export function getPdfFileName(): string {
  const path = decodeURIComponent(new URL(location.href).pathname);
  return path.split("/").pop() || "document.pdf";
}

export async function extractPdfText(): Promise<string | null> {
  try {
    const res = await fetch(location.href);
    if (!res.ok) {
      console.warn(`[OpenExtension] PDF fetch failed: ${res.status}`);
      return null;
    }
    const data = await res.arrayBuffer();
    return await parsePdfBytes(data);
  } catch (error) {
    console.warn("[OpenExtension] PDF text extraction threw.", error);
    return null;
  }
}
