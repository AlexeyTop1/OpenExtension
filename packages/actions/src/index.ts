import { askAboutPage } from "./builtins/askAboutPage";
import { explainPage } from "./builtins/explainPage";
import { findIssues } from "./builtins/findIssues";
import { rewritePage } from "./builtins/rewritePage";
import { summarizePage } from "./builtins/summarizePage";
import { translatePage } from "./builtins/translatePage";
import { customPromptSelection } from "./builtins/customPromptSelection";
import { explainSelection } from "./builtins/explainSelection";
import { fixGrammarSelection } from "./builtins/fixGrammarSelection";
import { improveSelection } from "./builtins/improveSelection";
import { longerSelection } from "./builtins/longerSelection";
import { shorterSelection } from "./builtins/shorterSelection";
import { translateSelection } from "./builtins/translateSelection";
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
  explainSelection,
  translateSelection,
  improveSelection,
  shorterSelection,
  longerSelection,
  fixGrammarSelection,
  customPromptSelection,
};

export const PAGE_ACTIONS: ActionDefinition[] = [
  explainPage,
  summarizePage,
  translatePage,
  rewritePage,
  findIssues,
  askAboutPage,
];

export const SELECTION_ACTIONS: ActionDefinition[] = [
  explainSelection,
  translateSelection,
  improveSelection,
  shorterSelection,
  longerSelection,
  fixGrammarSelection,
  customPromptSelection,
];
