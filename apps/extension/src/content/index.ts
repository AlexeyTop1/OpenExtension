import type { ExtensionMessage } from "../shared/messaging/types";
import { extractFormFields, setFieldValue } from "./agent/formFields";
import { extractRequestedContext } from "./context/extractPage";
import { fetchImageAsDataUrl } from "./context/fetchImage";
import { insertGmailReply } from "./context/gmailCompose";
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
  if (message.type === "FETCH_IMAGE_DATA_URL") {
    fetchImageAsDataUrl(message.imageUrl).then(sendResponse);
    return true;
  }
  if (message.type === "INSERT_GMAIL_REPLY") {
    insertGmailReply(message.text).then(sendResponse);
    return true;
  }
  if (message.type === "EXTRACT_FORM_FIELDS") {
    sendResponse(extractFormFields());
  }
  if (message.type === "SET_FIELD_VALUE") {
    sendResponse(setFieldValue(message.ref, message.value));
  }
  return undefined;
});

mountSelectionToolbar();
