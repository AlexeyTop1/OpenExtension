// Gmail's hash-based routing has several view prefixes (inbox/sent/all/
// label/search/...) all ending in a long opaque thread id — this is a coarse
// pre-filter only (used to decide whether to show the action button at all);
// the real "is a thread actually open" check happens in the DOM extractor.
export function isGmailThreadUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /(^|\.)mail\.google\.com$/.test(parsed.hostname) && /^#[^/]+\/.*[A-Za-z0-9_-]{10,}/.test(parsed.hash);
  } catch {
    return false;
  }
}
