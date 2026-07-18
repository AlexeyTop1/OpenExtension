// YouTube's own "api/timedtext" endpoint now requires a client-generated
// "Proof of Origin" token that isn't present in the page's static initial
// data, so fetching captions directly returns empty (200 OK, empty body).
// Instead, we drive the real transcript panel YouTube's own player already
// renders — it has a valid session, so it works — and read the resulting DOM.
//
// Segment markup confirmed live (2026-07): each segment is a
// <transcript-segment-view-model> in light DOM (not Shadow DOM) with three
// children — a timestamp div, a hidden a11y-label div, and a
// `.ytAttributedStringHost` span holding the actual spoken text. deepQueryAll
// is kept as a fallback in case YouTube ever moves this back into Shadow DOM
// (as some of their older ytd-* Polymer components do) or A/B-tests a
// different render path.

const BUTTON_WAIT_MS = 4000;
const SEGMENTS_WAIT_MS = 8000;
const POLL_INTERVAL_MS = 150;

async function waitFor<T>(check: () => T | null, timeoutMs: number): Promise<T | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = check();
    if (result) return result;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  return null;
}

function deepQueryAll(root: ParentNode, selector: string): Element[] {
  const found: Element[] = Array.from(root.querySelectorAll(selector));
  for (const el of Array.from(root.querySelectorAll("*"))) {
    if (el.shadowRoot) {
      found.push(...deepQueryAll(el.shadowRoot, selector));
    }
  }
  return found;
}

function findTranscriptButton(): HTMLElement | null {
  const scoped = deepQueryAll(document, "ytd-video-description-transcript-section-renderer button")[0];
  if (scoped instanceof HTMLElement) return scoped;

  const byAriaLabel = deepQueryAll(document, "button").find((btn) =>
    /transcript/i.test(btn.getAttribute("aria-label") ?? ""),
  );
  return byAriaLabel instanceof HTMLElement ? byAriaLabel : null;
}

function readTranscriptSegments(): string[] | null {
  let hosts: Element[] = Array.from(document.querySelectorAll("transcript-segment-view-model"));
  if (!hosts.length) {
    hosts = deepQueryAll(document, "transcript-segment-view-model");
  }
  if (!hosts.length) return null;

  const texts = hosts
    .map((host) => host.querySelector(".ytAttributedStringHost")?.textContent?.trim() ?? "")
    .filter(Boolean);

  return texts.length ? texts : null;
}

export async function scrapeYoutubeTranscript(): Promise<string | null> {
  const alreadyOpen = readTranscriptSegments();
  if (alreadyOpen?.length) {
    return alreadyOpen.join(" ").replace(/\s+/g, " ").trim() || null;
  }

  const button = await waitFor(findTranscriptButton, BUTTON_WAIT_MS);
  if (!button) {
    console.warn("[OpenExtension] Could not find the 'Show transcript' button — this video may not have captions.");
    return null;
  }
  button.click();

  const segments = await waitFor(readTranscriptSegments, SEGMENTS_WAIT_MS);
  if (!segments?.length) {
    console.warn("[OpenExtension] Clicked the transcript button but no segments appeared in time.");
    return null;
  }

  const text = segments.join(" ").replace(/\s+/g, " ").trim();
  if (!text) {
    console.warn("[OpenExtension] Transcript panel rendered but produced no text.");
  }
  return text || null;
}
