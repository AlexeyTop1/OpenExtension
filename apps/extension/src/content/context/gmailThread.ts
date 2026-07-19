import { getSelectorConfig } from "../../shared/selectorConfigStorage";

const MAX_CHARS = 100_000;

/**
 * Gmail's classic message-body markup (confirmed live 2026-07-19): each
 * message in a thread is `.ii.gt` wrapping `.a3s.aiL` (the actual rendered
 * body, HTML email and all — .textContent strips markup/tracking pixels down
 * to visible text), subject is `h2.hP`, sender name is `.gD`. These are
 * short-but-stable Closure-compiled class names Gmail has used for years, not
 * per-load-random — but if they ever break, update selectors/config.json
 * rather than guessing (see shared/selectorConfig.ts).
 */
export async function extractGmailThread(): Promise<string | null> {
  const config = (await getSelectorConfig()).gmail;
  const bodies = document.querySelectorAll<HTMLElement>(config.messageBodySelector);
  if (!bodies.length) return null;

  const messageTexts = Array.from(bodies)
    .map((body) => body.textContent?.replace(/\s+/g, " ").trim() ?? "")
    .filter(Boolean);
  if (!messageTexts.length) return null;

  const senderNames = Array.from(document.querySelectorAll<HTMLElement>(config.senderNameSelector)).map(
    (el) => el.textContent?.trim() ?? "",
  );
  const subject = document.querySelector(config.subjectSelector)?.textContent?.trim();

  const sections = subject ? [`Subject: ${subject}`] : [];
  messageTexts.forEach((text, index) => {
    const sender = senderNames[index];
    sections.push(`--- Message ${index + 1}${sender ? ` (from ${sender})` : ""} ---\n${text}`);
  });

  return sections.join("\n\n").slice(0, MAX_CHARS);
}
