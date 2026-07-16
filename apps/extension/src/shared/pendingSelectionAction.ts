// Background can't reliably deliver a message directly to the sidebar: the
// side panel may not be open (or mounted) yet when a selection action fires
// from a content script or context menu. Instead, background writes the
// pending action here and opens the side panel; the sidebar consumes it on
// mount and via chrome.storage.onChanged if it's already open.
export const PENDING_SELECTION_ACTION_KEY = "pendingSelectionAction";

export interface PendingSelectionAction {
  actionId: string;
  selectionText: string;
  createdAt: number;
}
