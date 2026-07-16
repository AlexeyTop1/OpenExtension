import { createRoot, type Root } from "react-dom/client";
import SelectionToolbar from "./SelectionToolbar";

let host: HTMLDivElement | null = null;
let root: Root | null = null;

function removeToolbar() {
  root?.unmount();
  root = null;
  host?.remove();
  host = null;
}

function showToolbar(rect: DOMRect, selectionText: string) {
  removeToolbar();

  host = document.createElement("div");
  host.style.position = "fixed";
  host.style.top = `${Math.max(rect.top - 40, 8)}px`;
  host.style.left = `${Math.max(rect.left, 8)}px`;
  host.style.zIndex = "2147483647";
  document.documentElement.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: "open" });
  const mountPoint = document.createElement("div");
  shadowRoot.appendChild(mountPoint);

  root = createRoot(mountPoint);
  root.render(<SelectionToolbar selectionText={selectionText} onDone={removeToolbar} />);
}

export function mountSelectionToolbar() {
  document.addEventListener("mouseup", (event) => {
    if (host?.contains(event.target as Node)) return;

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() ?? "";
      if (!text || !selection || selection.rangeCount === 0) {
        removeToolbar();
        return;
      }
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      showToolbar(rect, text);
    }, 0);
  });

  document.addEventListener("mousedown", (event) => {
    if (host && !host.contains(event.target as Node)) {
      removeToolbar();
    }
  });

  document.addEventListener("scroll", removeToolbar, true);
}
