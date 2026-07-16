import { SELECTION_ACTIONS } from "@openextension/actions";
import type { ContextField, PageContext } from "@openextension/context";
import type { ExtensionMessage } from "../shared/messaging/types";
import { PENDING_SELECTION_ACTION_KEY } from "../shared/pendingSelectionAction";

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Failed to set side panel behavior", error));

chrome.contextMenus.removeAll(() => {
  for (const action of SELECTION_ACTIONS) {
    chrome.contextMenus.create({ id: action.id, title: action.label, contexts: ["selection"] });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.selectionText) return;
  void triggerSelectionAction(String(info.menuItemId), info.selectionText, tab?.windowId);
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  if (message.type === "CONTEXT_REQUEST") {
    forwardContextRequest(message.fields).then(sendResponse);
    return true;
  }
  if (message.type === "RUN_SELECTION_ACTION") {
    void triggerSelectionAction(message.actionId, message.selectionText, sender.tab?.windowId);
    return undefined;
  }
  return undefined;
});

// Clears the "pending action" badge as soon as the sidebar has consumed it
// (both consumePendingSelectionAction and the onPendingSelectionAction live
// listener remove this key once they've picked it up).
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && PENDING_SELECTION_ACTION_KEY in changes && !changes[PENDING_SELECTION_ACTION_KEY].newValue) {
    chrome.action.setBadgeText({ text: "" });
  }
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

async function triggerSelectionAction(actionId: string, selectionText: string, windowId?: number) {
  await chrome.storage.local.set({
    [PENDING_SELECTION_ACTION_KEY]: { actionId, selectionText, createdAt: Date.now() },
  });
  if (windowId !== undefined) {
    try {
      await chrome.sidePanel.open({ windowId });
    } catch {
      // sidePanel.open() only succeeds when Chrome recognizes the call as a direct
      // user gesture (e.g. contextMenus.onClicked) — a click relayed from the
      // floating toolbar via chrome.runtime.sendMessage doesn't qualify. The
      // pending action is already saved above, so badge the icon and let the
      // user open the panel themselves; it'll run immediately once they do.
      chrome.action.setBadgeText({ text: "•" });
      chrome.action.setBadgeBackgroundColor({ color: "#2563eb" });
    }
  }
}
