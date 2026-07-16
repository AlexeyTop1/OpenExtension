import type { ChatMessage } from "@openextension/providers";
import type { ContextField, PageContext } from "@openextension/context";

export interface ActionContext {
  page?: Partial<PageContext>;
  selection?: string;
  input?: string;
}

export interface ActionDefinition {
  id: string;
  label: string;
  requiredFields: ContextField[];
  /** Slash-command slug (no leading "/"), e.g. "translate". Optional — only trigger surfaces that support commands (the Prompt Box) use it. */
  command?: string;
  /** Whether the result is a like-for-like rewrite of the selection, safe to offer inserting back into the source field (vs. e.g. an explanation, which isn't). */
  supportsReplace?: boolean;
  buildMessages(context: ActionContext): ChatMessage[];
}
