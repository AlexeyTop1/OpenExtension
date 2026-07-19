// Site DOM selectors live here as pure data (strings only, never executable
// code) so they can be refreshed from a remote JSON file without shipping a
// new extension build — see selectorConfigStorage.ts for the fetch/refresh
// side, and selectors/config.json at the repo root for the remote copy of
// this same shape. DEFAULT_SELECTOR_CONFIG below is the bundled fallback used
// until the first successful remote fetch (or forever, if the user is
// offline or the fetch fails) — keep it in sync with whatever's actually
// working, the same way selectors/config.json should be.
export interface SelectorConfig {
  version: number;
  youtube: {
    transcriptButtonSelector: string;
    transcriptButtonAriaLabelPattern: string;
    segmentSelector: string;
    segmentTextSelector: string;
  };
  github: {
    newUi: {
      tableSelector: string;
      pathAttrPrefix: string;
      additionLineSelector: string;
      deletionLineSelector: string;
      additionClass: string;
      codeInnerSelector: string;
    };
    classicUi: {
      fileSelector: string;
      filePathAttr: string;
      additionLineSelector: string;
      deletionLineSelector: string;
      additionClass: string;
    };
  };
  gmail: {
    subjectSelector: string;
    messageBodySelector: string;
    senderNameSelector: string;
  };
}

export const DEFAULT_SELECTOR_CONFIG: SelectorConfig = {
  version: 1,
  youtube: {
    transcriptButtonSelector: "ytd-video-description-transcript-section-renderer button",
    transcriptButtonAriaLabelPattern: "transcript",
    segmentSelector: "transcript-segment-view-model",
    segmentTextSelector: ".ytAttributedStringHost",
  },
  github: {
    newUi: {
      tableSelector: 'table[aria-label^="Diff for:"]',
      pathAttrPrefix: "Diff for:",
      additionLineSelector: ".diff-text.addition",
      deletionLineSelector: ".diff-text.deletion",
      additionClass: "addition",
      codeInnerSelector: ".diff-text-inner",
    },
    classicUi: {
      fileSelector: ".file[data-tagsearch-path]",
      filePathAttr: "data-tagsearch-path",
      additionLineSelector: ".blob-code-addition",
      deletionLineSelector: ".blob-code-deletion",
      additionClass: "blob-code-addition",
    },
  },
  gmail: {
    subjectSelector: "h2.hP",
    messageBodySelector: ".ii.gt .a3s.aiL",
    senderNameSelector: ".gD",
  },
};

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

// Deliberately shallow/strict: every leaf must be a non-empty string and every
// key must be present. This is the security boundary for remote config — it
// guarantees the fetched JSON can only ever supply selector *strings*, never
// new shape, functions, or anything else that downstream code might
// mistakenly treat as executable.
export function isValidSelectorConfig(value: unknown): value is SelectorConfig {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.version !== "number") return false;

  const yt = v.youtube as Record<string, unknown> | undefined;
  if (
    typeof yt !== "object" ||
    yt === null ||
    !isString(yt.transcriptButtonSelector) ||
    !isString(yt.transcriptButtonAriaLabelPattern) ||
    !isString(yt.segmentSelector) ||
    !isString(yt.segmentTextSelector)
  ) {
    return false;
  }

  const gh = v.github as Record<string, unknown> | undefined;
  if (typeof gh !== "object" || gh === null) return false;
  const newUi = gh.newUi as Record<string, unknown> | undefined;
  const classicUi = gh.classicUi as Record<string, unknown> | undefined;
  if (
    typeof newUi !== "object" ||
    newUi === null ||
    !isString(newUi.tableSelector) ||
    !isString(newUi.pathAttrPrefix) ||
    !isString(newUi.additionLineSelector) ||
    !isString(newUi.deletionLineSelector) ||
    !isString(newUi.additionClass) ||
    !isString(newUi.codeInnerSelector)
  ) {
    return false;
  }
  if (
    typeof classicUi !== "object" ||
    classicUi === null ||
    !isString(classicUi.fileSelector) ||
    !isString(classicUi.filePathAttr) ||
    !isString(classicUi.additionLineSelector) ||
    !isString(classicUi.deletionLineSelector) ||
    !isString(classicUi.additionClass)
  ) {
    return false;
  }

  const gmail = v.gmail as Record<string, unknown> | undefined;
  if (
    typeof gmail !== "object" ||
    gmail === null ||
    !isString(gmail.subjectSelector) ||
    !isString(gmail.messageBodySelector) ||
    !isString(gmail.senderNameSelector)
  ) {
    return false;
  }

  return true;
}
