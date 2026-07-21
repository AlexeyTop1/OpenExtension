import {
  PAGE_ACTIONS,
  summarizeYoutube,
  summarizeGithubDiff,
  explainGithubFile,
  summarizeGmailThread,
  draftGmailReply,
} from "@openextension/actions";

// Slash-command slugs already taken by built-in actions — Prompt Library and
// Marketplace installs both need this to avoid collisions.
export const BUILT_IN_COMMANDS = new Set(
  [...PAGE_ACTIONS, summarizeYoutube, summarizeGithubDiff, explainGithubFile, summarizeGmailThread, draftGmailReply]
    .map((action) => action.command)
    .filter((command): command is string => Boolean(command)),
);
