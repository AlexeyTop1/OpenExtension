import { askAboutPage } from "./builtins/askAboutPage";
import { explainPage } from "./builtins/explainPage";
import { findIssues } from "./builtins/findIssues";
import { rewritePage } from "./builtins/rewritePage";
import { summarizePage } from "./builtins/summarizePage";
import { translatePage } from "./builtins/translatePage";
import type { ActionDefinition } from "./types";

export * from "./types";
export * from "./promptEngine";
export * from "./formatPage";
export {
  explainPage,
  summarizePage,
  translatePage,
  rewritePage,
  findIssues,
  askAboutPage,
};

export const PAGE_ACTIONS: ActionDefinition[] = [
  explainPage,
  summarizePage,
  translatePage,
  rewritePage,
  findIssues,
  askAboutPage,
];
