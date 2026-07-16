// Background can't reliably deliver a message directly to the sidebar: the
// side panel may not be open (or mounted) yet when a selection action fires
// from a content script or context menu. Instead, background writes the
// pending action here and opens the side panel; the sidebar consumes it on
// mount and via chrome.storage.onChanged if it's already open.
export const PENDING_SELECTION_ACTION_KEY = "pendingSelectionAction";

export interface PendingSelectionAction {
  actionId: string;
  selectionText: string;
  // The tab the selection came from, so a later "Replace on page" can target
  // that exact tab rather than whichever tab happens to be active by then.
  tabId: number;
  isReplaceable: boolean;
  createdAt: number;
}
