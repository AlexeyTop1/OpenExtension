// Mirrors pendingSelectionAction.ts: background can't reliably message the
// sidebar directly (it may not be open/mounted yet), so it writes the pending
// action here and opens the side panel; the sidebar consumes it on mount and
// via chrome.storage.onChanged if already open. The image itself is fetched
// by the sidebar afterwards (see handleRunImageAction in App.tsx) rather than
// by background, so opening the side panel isn't delayed by a network fetch —
// that delay could push past the window Chrome allows for gesture-triggered
// sidePanel.open() calls.
export const PENDING_IMAGE_ACTION_KEY = "pendingImageAction";

export interface PendingImageAction {
  actionId: string;
  imageUrl: string;
  tabId: number;
  createdAt: number;
}
