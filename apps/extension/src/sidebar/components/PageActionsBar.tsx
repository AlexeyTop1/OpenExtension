import { PAGE_ACTIONS, translatePage, type ActionDefinition } from "@openextension/actions";

interface Props {
  onRunAction: (action: ActionDefinition) => void;
  disabled: boolean;
  translateTargetLanguage: string | null;
}

export default function PageActionsBar({ onRunAction, disabled, translateTargetLanguage }: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        padding: "8px 12px",
        borderTop: "1px solid #e5e5e5",
      }}
    >
      {PAGE_ACTIONS.map((action) => (
        <button
          key={action.id}
          onClick={() => onRunAction(action)}
          disabled={disabled}
          style={{ fontSize: 12, padding: "4px 8px" }}
        >
          {action.id === translatePage.id && translateTargetLanguage
            ? `${action.label} → ${translateTargetLanguage}`
            : action.label}
        </button>
      ))}
    </div>
  );
}
