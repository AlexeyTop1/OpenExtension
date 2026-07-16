import { Pin, X } from "lucide-react";

interface Props {
  title: string;
  onResume: () => void;
  onDismiss: () => void;
}

export default function PinBanner({ title, onResume, onDismiss }: Props) {
  return (
    <div className="chip chip-warn" style={{ margin: "var(--space-2) var(--space-3) 0" }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-1)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        <Pin className="icon" size={14} />
        Resume pinned chat for this page: {title}
      </span>
      <div style={{ display: "flex", gap: "var(--space-1)", flexShrink: 0 }}>
        <button className="btn btn-icon" onClick={onResume}>
          Resume
        </button>
        <button className="btn-ghost" onClick={onDismiss}>
          <X className="icon" size={14} />
        </button>
      </div>
    </div>
  );
}
