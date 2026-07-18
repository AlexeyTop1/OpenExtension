import { PENDING_IMAGE_ACTION_KEY, type PendingImageAction } from "../shared/pendingImageAction";

export async function consumePendingImageAction(): Promise<PendingImageAction | undefined> {
  const result = await chrome.storage.local.get(PENDING_IMAGE_ACTION_KEY);
  const pending = result[PENDING_IMAGE_ACTION_KEY] as PendingImageAction | undefined;
  if (pending) {
    await chrome.storage.local.remove(PENDING_IMAGE_ACTION_KEY);
  }
  return pending;
}

export function onPendingImageAction(callback: (pending: PendingImageAction) => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (areaName !== "local") return;
    const change = changes[PENDING_IMAGE_ACTION_KEY];
    if (change?.newValue) {
      callback(change.newValue as PendingImageAction);
      void chrome.storage.local.remove(PENDING_IMAGE_ACTION_KEY);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
