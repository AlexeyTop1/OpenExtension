import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

const MAX_CHARS = 100_000;
const MAX_PAGES = 50;

// Shared by both the content script (fetches an https:// PDF's own bytes)
// and the sidebar (reads bytes from a user-picked local file via <input
// type="file">, which needs no file:// permissions at all).
export async function parsePdfBytes(data: ArrayBuffer): Promise<string | null> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pageCount = Math.min(pdf.numPages, MAX_PAGES);

  const pageTexts: string[] = [];
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    pageTexts.push(pageText);
  }

  const text = pageTexts.join("\n\n").replace(/[ \t]+/g, " ").trim();
  if (!text) {
    console.warn("[OpenExtension] PDF parsed but found no extractable text (likely a scanned/image-only PDF).");
    return null;
  }

  const truncated = pdf.numPages > MAX_PAGES;
  if (truncated) {
    console.warn(`[OpenExtension] PDF has ${pdf.numPages} pages; only the first ${MAX_PAGES} were extracted.`);
  }

  return text.slice(0, MAX_CHARS);
}
