import { extractReadableContent, isYoutubeWatchUrl, type ContextField, type PageContext } from "@openextension/context";
import { extractPdfText, getPdfFileName, isLocalPdf, isPdfDocument } from "./pdfText";
import { scrapeYoutubeTranscript } from "./youtubeTranscript";

export async function extractRequestedContext(fields: ContextField[]): Promise<Partial<PageContext>> {
  const result: Partial<PageContext> = { extractedAt: Date.now() };

  if (fields.includes("url")) {
    result.url = location.href;
  }
  if (fields.includes("title")) {
    result.title = document.title;
  }

  if (fields.includes("markdown") && isPdfDocument()) {
    if (isLocalPdf()) {
      result.localPdfName = getPdfFileName();
    } else {
      // The PDF's actual content lives inside Chrome's built-in viewer, which
      // we have no DOM access to — Readability would find nothing useful on
      // this wrapper page, so we fetch and parse the PDF's own bytes instead.
      result.markdown = (await extractPdfText().catch((error: unknown) => {
        console.warn("[OpenExtension] PDF text extraction threw.", error);
        return null;
      })) ?? undefined;
    }
  } else if (fields.includes("markdown") || fields.includes("html")) {
    const readable = extractReadableContent(document);
    if (readable) {
      result.title = result.title ?? readable.title;
      if (fields.includes("markdown")) {
        result.markdown = readable.markdown;
      }
    }
    if (fields.includes("html")) {
      result.html = document.documentElement.outerHTML.slice(0, 100_000);
    }
  }

  if (fields.includes("selection")) {
    result.selection = window.getSelection()?.toString() || "";
  }

  if (fields.includes("youtubeTranscript") && isYoutubeWatchUrl(location.href)) {
    const transcript = await scrapeYoutubeTranscript().catch((error: unknown) => {
      console.warn("[OpenExtension] YouTube transcript extraction threw.", error);
      return null;
    });
    if (transcript) {
      result.youtubeTranscript = transcript;
    }
  }

  return result;
}
