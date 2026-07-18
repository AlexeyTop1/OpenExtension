import type { FetchImageDataUrlResponse } from "../../shared/messaging/types";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function fetchImageAsDataUrl(imageUrl: string): Promise<FetchImageDataUrlResponse> {
  if (imageUrl.startsWith("file:")) {
    // Same "Allow access to file URLs" gate as local PDFs — no upload-picker
    // fallback here yet since right-clicking a page's own local <img> is a
    // much rarer path than opening a local PDF directly.
    return { error: "Local images (file://) aren't supported yet — try an image hosted on a website." };
  }
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      return { error: `Couldn't download that image (HTTP ${res.status}).` };
    }
    const blob = await res.blob();
    if (blob.size > MAX_IMAGE_BYTES) {
      return { error: "That image is too large to analyze (over 8MB)." };
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    return { dataUrl };
  } catch (error) {
    console.warn("[OpenExtension] Image fetch threw.", error);
    return { error: "Couldn't read that image — the site may block cross-origin access to it." };
  }
}
