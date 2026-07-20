import { storageGet, storageSet } from "../storage/local";

export const SELECTION_TOOLBAR_ENABLED_KEY = "selectionToolbarEnabled";

export async function isSelectionToolbarEnabled(): Promise<boolean> {
  const value = await storageGet<boolean>(SELECTION_TOOLBAR_ENABLED_KEY);
  return value ?? true;
}

export async function setSelectionToolbarEnabled(enabled: boolean): Promise<void> {
  await storageSet(SELECTION_TOOLBAR_ENABLED_KEY, enabled);
}
