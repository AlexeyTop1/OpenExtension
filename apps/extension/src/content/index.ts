import type { ExtensionMessage } from "../shared/messaging/types";
import { extractRequestedContext } from "./context/extractPage";

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === "EXTRACT_CONTEXT") {
    sendResponse(extractRequestedContext(message.fields));
  }
});
