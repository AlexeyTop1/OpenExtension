import { PENDING_SELECTION_ACTION_KEY, type PendingSelectionAction } from "../shared/pendingSelectionAction";

export async function consumePendingSelectionAction(): Promise<PendingSelectionAction | undefined> {
  const result = await chrome.storage.local.get(PENDING_SELECTION_ACTION_KEY);
  const pending = result[PENDING_SELECTION_ACTION_KEY] as PendingSelectionAction | undefined;
  if (pending) {
    await chrome.storage.local.remove(PENDING_SELECTION_ACTION_KEY);
  }
  return pending;
}

export function onPendingSelectionAction(callback: (pending: PendingSelectionAction) => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (areaName !== "local") return;
    const change = changes[PENDING_SELECTION_ACTION_KEY];
    if (change?.newValue) {
      callback(change.newValue as PendingSelectionAction);
      void chrome.storage.local.remove(PENDING_SELECTION_ACTION_KEY);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
