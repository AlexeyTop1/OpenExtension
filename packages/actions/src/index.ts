import { askAboutPage } from "./builtins/askAboutPage";
import { explainPage } from "./builtins/explainPage";
import { findIssues } from "./builtins/findIssues";
import { rewritePage } from "./builtins/rewritePage";
import { summarizePage } from "./builtins/summarizePage";
import { summarizeYoutube } from "./builtins/summarizeYoutube";
import { summarizeGithubDiff } from "./builtins/summarizeGithubDiff";
import { explainGithubFile } from "./builtins/explainGithubFile";
import { summarizeGmailThread } from "./builtins/summarizeGmailThread";
import { draftGmailReply } from "./builtins/draftGmailReply";
import { translatePage } from "./builtins/translatePage";
import { customPromptSelection } from "./builtins/customPromptSelection";
import { explainSelection } from "./builtins/explainSelection";
import { fixGrammarSelection } from "./builtins/fixGrammarSelection";
import { improveSelection } from "./builtins/improveSelection";
import { longerSelection } from "./builtins/longerSelection";
import { shorterSelection } from "./builtins/shorterSelection";
import { translateSelection } from "./builtins/translateSelection";
import { describeImage } from "./builtins/describeImage";
import { extractImageText } from "./builtins/extractImageText";
import { generateAltText } from "./builtins/generateAltText";
import type { ActionDefinition } from "./types";

export * from "./types";
export * from "./promptEngine";
export * from "./formatPage";
export {
  explainPage,
  summarizePage,
  summarizeYoutube,
  summarizeGithubDiff,
  explainGithubFile,
  summarizeGmailThread,
  draftGmailReply,
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
  describeImage,
  extractImageText,
  generateAltText,
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

export const IMAGE_ACTIONS: ActionDefinition[] = [describeImage, extractImageText, generateAltText];
