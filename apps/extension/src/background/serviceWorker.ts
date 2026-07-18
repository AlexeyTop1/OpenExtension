import { IMAGE_ACTIONS, SELECTION_ACTIONS } from "@openextension/actions";
import type { ContextField, PageContext } from "@openextension/context";
import type { ExtensionMessage } from "../shared/messaging/types";
import { PENDING_IMAGE_ACTION_KEY } from "../shared/pendingImageAction";
import { PENDING_SELECTION_ACTION_KEY } from "../shared/pendingSelectionAction";

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Failed to set side panel behavior", error));

chrome.contextMenus.removeAll(() => {
  for (const action of SELECTION_ACTIONS) {
    chrome.contextMenus.create({ id: action.id, title: action.label, contexts: ["selection"] });
  }
  for (const action of IMAGE_ACTIONS) {
    chrome.contextMenus.create({ id: action.id, title: action.label, contexts: ["image"] });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab?.id === undefined) return;
  if (info.selectionText) {
    // No floating-toolbar capture happened for a right-click, so there's no
    // remembered field/range to write back into yet.
    void triggerSelectionAction(String(info.menuItemId), info.selectionText, false, tab.id, tab.windowId);
  } else if (info.srcUrl) {
    void triggerImageAction(String(info.menuItemId), info.srcUrl, tab.id, tab.windowId);
  }
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  if (message.type === "CONTEXT_REQUEST") {
    forwardContextRequest(message.fields).then(sendResponse);
    return true;
  }
  if (message.type === "RUN_SELECTION_ACTION" && sender.tab?.id !== undefined) {
    void triggerSelectionAction(
      message.actionId,
      message.selectionText,
      message.isReplaceable,
      sender.tab.id,
      sender.tab.windowId,
    );
    return undefined;
  }
  return undefined;
});

// Clears the "pending action" badge as soon as the sidebar has consumed it
// (both consumePendingSelectionAction/consumePendingImageAction and their
// live-listener counterparts remove the relevant key once picked up).
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  const selectionCleared = PENDING_SELECTION_ACTION_KEY in changes && !changes[PENDING_SELECTION_ACTION_KEY].newValue;
  const imageCleared = PENDING_IMAGE_ACTION_KEY in changes && !changes[PENDING_IMAGE_ACTION_KEY].newValue;
  if (selectionCleared || imageCleared) {
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

async function triggerSelectionAction(
  actionId: string,
  selectionText: string,
  isReplaceable: boolean,
  tabId: number,
  windowId?: number,
) {
  await chrome.storage.local.set({
    [PENDING_SELECTION_ACTION_KEY]: { actionId, selectionText, isReplaceable, tabId, createdAt: Date.now() },
  });
  await openSidePanelOrBadge(windowId);
}

async function triggerImageAction(actionId: string, imageUrl: string, tabId: number, windowId?: number) {
  await chrome.storage.local.set({
    [PENDING_IMAGE_ACTION_KEY]: { actionId, imageUrl, tabId, createdAt: Date.now() },
  });
  await openSidePanelOrBadge(windowId);
}

async function openSidePanelOrBadge(windowId?: number) {
  if (windowId === undefined) return;
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
