import type { ContextField, PageContext } from "@openextension/context";

// Sidebar/options -> background. Sent via chrome.runtime.sendMessage, which is
// received extension-wide (including every content script instance) — so this
// type must stay distinct from ExtractContextMessage below, or a content
// script on some other tab could race to answer a request meant for the
// active tab.
export interface ContextRequestMessage {
  type: "CONTEXT_REQUEST";
  fields: ContextField[];
}

// Background -> the active tab's content script only, via chrome.tabs.sendMessage.
export interface ExtractContextMessage {
  type: "EXTRACT_CONTEXT";
  fields: ContextField[];
}

// Not yet handled (selection toolbar/actions land in a later milestone) — typed
// now so the message union doesn't need to change shape when they do.
export interface RunSelectionActionMessage {
  type: "RUN_SELECTION_ACTION";
  actionId: string;
  selectionText: string;
}

export interface OpenSidebarWithPromptMessage {
  type: "OPEN_SIDEBAR_WITH_PROMPT";
  prompt: string;
  context?: Partial<PageContext>;
}

export type ExtensionMessage =
  | ContextRequestMessage
  | ExtractContextMessage
  | RunSelectionActionMessage
  | OpenSidebarWithPromptMessage;
