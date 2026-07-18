import type { ExtensionMessage } from "../shared/messaging/types";
import { extractRequestedContext } from "./context/extractPage";
import { mountSelectionToolbar } from "./selectionToolbar/mount";
import { replaceCapturedSelection } from "./selectionToolbar/replaceTarget";

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === "EXTRACT_CONTEXT") {
    extractRequestedContext(message.fields).then(sendResponse);
    return true;
  }
  if (message.type === "REPLACE_SELECTION") {
    sendResponse(replaceCapturedSelection(message.text));
  }
  return undefined;
});

mountSelectionToolbar();
