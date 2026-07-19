const MAX_CHARS = 100_000;
const MAX_LINES_PER_FILE = 400;

/**
 * GitHub is mid-migration between two different PR diff UIs, confirmed live
 * 2026-07-19 — which one a given account sees isn't predictable, so both are
 * scraped, new UI first:
 *  - New UI (`/pull/N/changes`): each file is a `<table aria-label="Diff for: <path>">`
 *    (Primer-React "DiffLines" component); lines are `<code class="diff-text addition|deletion">`
 *    with the actual code in a nested `.diff-text-inner`.
 *  - Classic UI (`/pull/N/files`, still served to logged-out/non-JS requests):
 *    `.file[data-tagsearch-path]` wraps each file; lines are `<td>` elements
 *    with `blob-code-addition`/`blob-code-deletion` classes.
 * GitHub rolls out new UI behind feature flags periodically, so if this stops
 * finding files again, re-derive selectors from a real page rather than
 * guessing — same lesson as the YouTube transcript selectors.
 */
export function extractGithubDiff(): string | null {
  const sections = extractFromNewUi();
  if (!sections.length) sections.push(...extractFromClassicUi());
  if (!sections.length) return null;
  return sections.join("\n\n").slice(0, MAX_CHARS);
}

function extractFromNewUi(): string[] {
  const tables = document.querySelectorAll<HTMLTableElement>('table[aria-label^="Diff for:"]');
  const sections: string[] = [];
  for (const table of tables) {
    const path = table.getAttribute("aria-label")?.replace(/^Diff for:\s*/, "") ?? "unknown file";
    const rows = table.querySelectorAll<HTMLElement>(".diff-text.addition, .diff-text.deletion");
    if (!rows.length) continue;

    const lines = Array.from(rows)
      .slice(0, MAX_LINES_PER_FILE)
      .map((row) => {
        const prefix = row.classList.contains("addition") ? "+" : "-";
        const code = row.querySelector(".diff-text-inner")?.textContent ?? row.textContent ?? "";
        return `${prefix} ${code}`;
      });
    sections.push(`### ${path}\n\`\`\`diff\n${lines.join("\n")}\n\`\`\``);
  }
  return sections;
}

function extractFromClassicUi(): string[] {
  const files = document.querySelectorAll<HTMLElement>(".file[data-tagsearch-path]");
  const sections: string[] = [];
  for (const file of files) {
    const path = file.dataset.tagsearchPath ?? "unknown file";
    const rows = file.querySelectorAll<HTMLElement>(".blob-code-addition, .blob-code-deletion");
    if (!rows.length) continue;

    const lines = Array.from(rows)
      .slice(0, MAX_LINES_PER_FILE)
      .map((row) => `${row.classList.contains("blob-code-addition") ? "+" : "-"} ${row.textContent?.trim() ?? ""}`);
    sections.push(`### ${path}\n\`\`\`diff\n${lines.join("\n")}\n\`\`\``);
  }
  return sections;
}
