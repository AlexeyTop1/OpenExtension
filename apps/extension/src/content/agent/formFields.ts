// First primitive toward the eventual v0.4 "agent" concept: extract fillable
// form fields on the current page and let the sidebar (with LLM help) decide
// values, one field at a time, always with explicit user approval before
// anything is written — see setFieldValue below, which reuses the same
// native-setter+dispatch-event trick already proven in selectionToolbar/replaceTarget.ts.

type FillableElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

// Registry is rebuilt on every extractFormFields() call and referenced by
// `ref` from later setFieldValue() calls — module-level state is fine here
// since both happen within the same content-script lifetime (one per page load).
let fieldRegistry = new Map<string, FillableElement>();

const FILLABLE_INPUT_TYPES = new Set(["text", "email", "tel", "url", "search", "number", "password", ""]);

// Scoped to what's currently in the viewport, not the whole page — a page
// can have several forms (e.g. a header search box plus the actual form the
// user is looking at), and only the one they're actively viewing is relevant.
function isInViewport(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
}

function isFillable(el: Element): el is FillableElement {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    return !el.disabled && el.offsetParent !== null && isInViewport(el);
  }
  if (el instanceof HTMLInputElement) {
    return FILLABLE_INPUT_TYPES.has(el.type) && !el.disabled && el.offsetParent !== null && isInViewport(el);
  }
  return false;
}

function labelFor(el: FillableElement): string {
  if (el.id) {
    const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel?.trim()) return ariaLabel.trim();
  const closestLabel = el.closest("label");
  if (closestLabel?.textContent?.trim()) return closestLabel.textContent.trim();
  const placeholder = el.getAttribute("placeholder");
  if (placeholder?.trim()) return placeholder.trim();
  const name = el.getAttribute("name");
  if (name?.trim()) return name.trim();
  return "(unlabeled field)";
}

export interface FormFieldInfo {
  ref: string;
  label: string;
  type: string;
  currentValue: string;
}

export function extractFormFields(): FormFieldInfo[] {
  fieldRegistry = new Map();
  const fields: FormFieldInfo[] = [];
  let index = 0;
  for (const el of document.querySelectorAll("input, textarea, select")) {
    if (!isFillable(el)) continue;
    const ref = `field-${index++}`;
    fieldRegistry.set(ref, el);
    fields.push({
      ref,
      label: labelFor(el),
      type: el instanceof HTMLInputElement ? el.type : el.tagName.toLowerCase(),
      currentValue: el.value,
    });
  }
  return fields;
}

export function setFieldValue(ref: string, value: string): boolean {
  const el = fieldRegistry.get(ref);
  if (!el) return false;

  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}
