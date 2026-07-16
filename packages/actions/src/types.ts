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
  buildMessages(context: ActionContext): ChatMessage[];
}
