export function isGithubPRUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /(^|\.)github\.com$/.test(parsed.hostname) && /^\/[^/]+\/[^/]+\/pull\/\d+/.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function isGithubFileUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /(^|\.)github\.com$/.test(parsed.hostname) && /^\/[^/]+\/[^/]+\/blob\/.+/.test(parsed.pathname);
  } catch {
    return false;
  }
}
