import type { ExtensionMessage } from "../shared/messaging/types";
import { extractRequestedContext } from "./context/extractPage";
import { mountSelectionToolbar } from "./selectionToolbar/mount";

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === "EXTRACT_CONTEXT") {
    sendResponse(extractRequestedContext(message.fields));
  }
});

mountSelectionToolbar();
