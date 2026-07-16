import type { ContextField, PageContext } from "@openextension/context";
import type { ExtensionMessage } from "../shared/messaging/types";

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Failed to set side panel behavior", error));

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === "CONTEXT_REQUEST") {
    forwardContextRequest(message.fields).then(sendResponse);
    return true;
  }
  return undefined;
});

async function forwardContextRequest(fields: ContextField[]): Promise<Partial<PageContext>> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return {};
  }
  try {
    return await chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_CONTEXT", fields });
  } catch {
    // No content script on this tab (chrome:// pages, the Web Store, PDF viewer, etc.).
    return {};
  }
}
