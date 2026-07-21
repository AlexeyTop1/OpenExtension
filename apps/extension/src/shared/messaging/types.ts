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

// Content script (selection toolbar) -> background, via chrome.runtime.sendMessage.
export interface RunSelectionActionMessage {
  type: "RUN_SELECTION_ACTION";
  actionId: string;
  selectionText: string;
  // Whether the content script found an editable field/contenteditable range
  // behind the selection that a later REPLACE_SELECTION could write back into.
  isReplaceable: boolean;
}

// Sidebar -> the tab that originated a replaceable selection action, via
// chrome.tabs.sendMessage(tabId, ...) directly (no background relay needed,
// since the sidebar already knows which tab from the pending selection action).
export interface ReplaceSelectionMessage {
  type: "REPLACE_SELECTION";
  text: string;
}

export interface OpenSidebarWithPromptMessage {
  type: "OPEN_SIDEBAR_WITH_PROMPT";
  prompt: string;
  context?: Partial<PageContext>;
}

// Sidebar -> the tab an image action's context-menu click came from, via
// chrome.tabs.sendMessage(tabId, ...). Fetching happens in the content script
// (page-origin fetch, same privilege an <img> tag already has) rather than in
// the sidebar or background, neither of which have that origin's context.
export interface FetchImageDataUrlMessage {
  type: "FETCH_IMAGE_DATA_URL";
  imageUrl: string;
}

export type FetchImageDataUrlResponse = { dataUrl: string } | { error: string };

// Sidebar -> the tab a Gmail draft-reply action ran against, via
// chrome.tabs.sendMessage(tabId, ...) directly, same pattern as
// ReplaceSelectionMessage — writes into whatever compose box is currently open.
export interface InsertGmailReplyMessage {
  type: "INSERT_GMAIL_REPLY";
  text: string;
}

// Sidebar -> the active tab, via chrome.tabs.sendMessage(tabId, ...) directly.
// First primitive toward the v0.4 "agent" concept — see content/agent/formFields.ts.
export interface ExtractFormFieldsMessage {
  type: "EXTRACT_FORM_FIELDS";
}

export interface SetFieldValueMessage {
  type: "SET_FIELD_VALUE";
  ref: string;
  value: string;
}

export type ExtensionMessage =
  | ContextRequestMessage
  | ExtractContextMessage
  | RunSelectionActionMessage
  | ReplaceSelectionMessage
  | OpenSidebarWithPromptMessage
  | FetchImageDataUrlMessage
  | InsertGmailReplyMessage
  | ExtractFormFieldsMessage
  | SetFieldValueMessage;
