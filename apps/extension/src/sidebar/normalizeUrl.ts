/** Origin + pathname, stripping query/hash so tracking params don't defeat a pin match. */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}
