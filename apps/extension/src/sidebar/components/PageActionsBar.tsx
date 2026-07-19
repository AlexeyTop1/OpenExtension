import { PAGE_ACTIONS, translatePage, type ActionDefinition } from "@openextension/actions";

interface Props {
  onRunAction: (action: ActionDefinition) => void;
  disabled: boolean;
  translateTargetLanguage: string | null;
  /** Site-specific actions (e.g. "Summarize video" on YouTube) shown before the generic page actions. */
  extraActions?: ActionDefinition[];
}

export default function PageActionsBar({ onRunAction, disabled, translateTargetLanguage, extraActions = [] }: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: "var(--space-1)",
        flexWrap: "wrap",
        padding: "var(--space-2) var(--space-3)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      {extraActions.map((action) => (
        <button key={action.id} className="btn btn-icon btn-primary" onClick={() => onRunAction(action)} disabled={disabled}>
          {action.label}
        </button>
      ))}
      {PAGE_ACTIONS.map((action) => (
        <button key={action.id} className="btn btn-icon" onClick={() => onRunAction(action)} disabled={disabled}>
          {action.id === translatePage.id && translateTargetLanguage
            ? `${action.label} → ${translateTargetLanguage}`
            : action.label}
        </button>
      ))}
    </div>
  );
}
