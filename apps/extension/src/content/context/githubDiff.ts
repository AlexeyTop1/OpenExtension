import { getSelectorConfig } from "../../shared/selectorConfigStorage";
import type { SelectorConfig } from "../../shared/selectorConfig";

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
 * finding files again, update selectors/config.json rather than guessing —
 * same lesson as the YouTube transcript selectors. The selector strings
 * themselves live in shared/selectorConfig.ts, not hardcoded here.
 */
export async function extractGithubDiff(): Promise<string | null> {
  const config = (await getSelectorConfig()).github;
  const sections = extractFromNewUi(config.newUi);
  if (!sections.length) sections.push(...extractFromClassicUi(config.classicUi));
  if (!sections.length) return null;
  return sections.join("\n\n").slice(0, MAX_CHARS);
}

function extractFromNewUi(selectors: SelectorConfig["github"]["newUi"]): string[] {
  const tables = document.querySelectorAll<HTMLTableElement>(selectors.tableSelector);
  const prefixPattern = new RegExp(`^${selectors.pathAttrPrefix}\\s*`);
  const sections: string[] = [];
  for (const table of tables) {
    const path = table.getAttribute("aria-label")?.replace(prefixPattern, "") ?? "unknown file";
    const rows = table.querySelectorAll<HTMLElement>(`${selectors.additionLineSelector}, ${selectors.deletionLineSelector}`);
    if (!rows.length) continue;

    const lines = Array.from(rows)
      .slice(0, MAX_LINES_PER_FILE)
      .map((row) => {
        const prefix = row.classList.contains(selectors.additionClass) ? "+" : "-";
        const code = row.querySelector(selectors.codeInnerSelector)?.textContent ?? row.textContent ?? "";
        return `${prefix} ${code}`;
      });
    sections.push(`### ${path}\n\`\`\`diff\n${lines.join("\n")}\n\`\`\``);
  }
  return sections;
}

function extractFromClassicUi(selectors: SelectorConfig["github"]["classicUi"]): string[] {
  const files = document.querySelectorAll<HTMLElement>(selectors.fileSelector);
  const sections: string[] = [];
  for (const file of files) {
    const path = file.getAttribute(selectors.filePathAttr) ?? "unknown file";
    const rows = file.querySelectorAll<HTMLElement>(`${selectors.additionLineSelector}, ${selectors.deletionLineSelector}`);
    if (!rows.length) continue;

    const lines = Array.from(rows)
      .slice(0, MAX_LINES_PER_FILE)
      .map((row) => `${row.classList.contains(selectors.additionClass) ? "+" : "-"} ${row.textContent?.trim() ?? ""}`);
    sections.push(`### ${path}\n\`\`\`diff\n${lines.join("\n")}\n\`\`\``);
  }
  return sections;
}
