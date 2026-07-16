type ReplaceTarget =
  | { kind: "field"; element: HTMLInputElement | HTMLTextAreaElement; start: number; end: number }
  | { kind: "range"; range: Range };

let currentTarget: ReplaceTarget | null = null;

function isTextField(el: Element | null): el is HTMLInputElement | HTMLTextAreaElement {
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) {
    return ["text", "search", "url", "tel", "email", ""].includes(el.type);
  }
  return false;
}

/** Call when the floating toolbar is shown; returns whether the selection can later be replaced in place. */
export function captureReplaceTarget(): boolean {
  const active = document.activeElement;
  if (
    isTextField(active) &&
    active.selectionStart !== null &&
    active.selectionEnd !== null &&
    active.selectionStart !== active.selectionEnd
  ) {
    currentTarget = { kind: "field", element: active, start: active.selectionStart, end: active.selectionEnd };
    return true;
  }

  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
    const range = selection.getRangeAt(0);
    const node = range.commonAncestorContainer;
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
    if (el?.closest('[contenteditable="true"], [contenteditable=""]')) {
      currentTarget = { kind: "range", range: range.cloneRange() };
      return true;
    }
  }

  currentTarget = null;
  return false;
}

export function clearReplaceTarget(): void {
  currentTarget = null;
}

/** Writes `text` into the previously captured target. One-shot: clears the target either way. */
export function replaceCapturedSelection(text: string): boolean {
  const target = currentTarget;
  currentTarget = null;
  if (!target) return false;

  if (target.kind === "field") {
    const { element, start, end } = target;
    const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    // Setting .value directly doesn't notify frameworks (React etc.) that patch
    // the instance's own setter to track "last known value" — going through the
    // native prototype setter bypasses that patch, and the input event afterward
    // is what such frameworks actually listen for.
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    const newValue = element.value.slice(0, start) + text + element.value.slice(end);
    if (setter) {
      setter.call(element, newValue);
    } else {
      element.value = newValue;
    }
    element.setSelectionRange(start, start + text.length);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  const { range } = target;
  range.deleteContents();
  range.insertNode(document.createTextNode(text));
  const node = range.commonAncestorContainer;
  const host = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  host?.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}
