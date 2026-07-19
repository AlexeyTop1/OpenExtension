import { getSelectorConfig } from "../../shared/selectorConfigStorage";

const MAX_CHARS = 100_000;

/**
 * GitHub's file viewer is a React component, not article-like content, so
 * Readability wouldn't find anything useful. Confirmed live 2026-07-20: the
 * whole raw file is kept as plain text in a hidden textarea (for native
 * text selection/copy/accessibility), so reading `.value` off it is both
 * simpler and more robust than trying to reconstruct text from the
 * syntax-highlighted per-line cells. If this breaks, update
 * selectors/config.json rather than guessing (see shared/selectorConfig.ts).
 */
export async function extractGithubFile(): Promise<string | null> {
  const config = (await getSelectorConfig()).github.fileView;
  const textarea = document.querySelector<HTMLTextAreaElement>(config.contentSelector);
  const code = textarea?.value;
  if (!code) return null;

  const filename = document.querySelector(config.filenameSelector)?.textContent?.trim();
  const header = filename ? `File: ${filename}\n\n` : "";
  return (header + "```\n" + code + "\n```").slice(0, MAX_CHARS);
}
