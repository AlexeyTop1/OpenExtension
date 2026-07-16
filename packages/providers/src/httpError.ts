export function describeProviderError(label: string, status: number, body: string): string {
  if (status === 401 || status === 403) {
    return `${label} rejected the API key — check it in Options.`;
  }
  if (status === 429) {
    return `${label} rate-limited this request — wait a moment and try again.`;
  }
  if (status >= 500) {
    return `${label} is having server issues right now — try again shortly.`;
  }
  const trimmed = body.trim();
  return trimmed ? `${label} request failed (${status}): ${trimmed.slice(0, 200)}` : `${label} request failed (${status}).`;
}
