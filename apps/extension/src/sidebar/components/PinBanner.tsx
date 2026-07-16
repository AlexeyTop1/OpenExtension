interface Props {
  title: string;
  onResume: () => void;
  onDismiss: () => void;
}

export default function PinBanner({ title, onResume, onDismiss }: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        margin: "8px 12px 0",
        padding: "6px 8px",
        background: "#fef3c7",
        borderRadius: 6,
        fontSize: 12,
        gap: 8,
      }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        📌 Resume pinned chat for this page: {title}
      </span>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <button onClick={onResume} style={{ fontSize: 12 }}>
          Resume
        </button>
        <button onClick={onDismiss} style={{ fontSize: 12 }}>
          ×
        </button>
      </div>
    </div>
  );
}
