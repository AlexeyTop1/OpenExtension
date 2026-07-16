import type { ChatMessage } from "@openextension/providers";
import type { ActionContext, ActionDefinition } from "./types";

export function runAction(action: ActionDefinition, context: ActionContext): ChatMessage[] {
  return action.buildMessages(context);
}
