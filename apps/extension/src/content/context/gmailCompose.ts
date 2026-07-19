import { getSelectorConfig } from "../../shared/selectorConfigStorage";

/**
 * Writes a drafted reply into Gmail's currently open compose box. Confirmed
 * live 2026-07-19: a fresh reply's editable body starts effectively empty
 * (just a stray <br>) — any quoted original text lives in a separate,
 * initially-collapsed sibling element (aria-owns/aria-controls point to it),
 * not inside this contenteditable — so clearing and repopulating it doesn't
 * risk deleting the quote. Builds each line as its own <div> via DOM APIs
 * (not innerHTML) so there's no need to escape the LLM's output by hand.
 */
export async function insertGmailReply(text: string): Promise<boolean> {
  const config = (await getSelectorConfig()).gmail;
  const compose = document.querySelector<HTMLElement>(config.composeBodySelector);
  if (!compose) return false;

  compose.focus();
  compose.textContent = "";
  for (const line of text.split("\n")) {
    const div = document.createElement("div");
    if (line) {
      div.textContent = line;
    } else {
      div.appendChild(document.createElement("br"));
    }
    compose.appendChild(div);
  }
  compose.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}
