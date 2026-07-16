import { SELECTION_ACTIONS } from "@openextension/actions";

interface Props {
  selectionText: string;
  isReplaceable: boolean;
  onDone: () => void;
}

export default function SelectionToolbar({ selectionText, isReplaceable, onDone }: Props) {
  const handleClick = (actionId: string) => {
    chrome.runtime.sendMessage({ type: "RUN_SELECTION_ACTION", actionId, selectionText, isReplaceable });
    onDone();
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        background: "#1f2937",
        padding: 6,
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {SELECTION_ACTIONS.map((action) => (
        <button
          key={action.id}
          onClick={() => handleClick(action.id)}
          style={{
            fontSize: 12,
            padding: "4px 8px",
            background: "#374151",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
