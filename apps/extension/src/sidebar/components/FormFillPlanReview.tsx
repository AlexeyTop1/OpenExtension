import { X } from "lucide-react";
import type { FormFillStep } from "../formFillAgent";

interface Props {
  steps: FormFillStep[];
  values: Record<string, string>;
  checked: Record<string, boolean>;
  applying: boolean;
  onValueChange: (ref: string, value: string) => void;
  onCheckedChange: (ref: string, checked: boolean) => void;
  onApply: () => void;
  onCancel: () => void;
}

export default function FormFillPlanReview({
  steps,
  values,
  checked,
  applying,
  onValueChange,
  onCheckedChange,
  onApply,
  onCancel,
}: Props) {
  const checkedCount = steps.filter((step) => checked[step.ref]).length;

  return (
    <div
      className="panel"
      style={{
        margin: "0 var(--space-3) var(--space-2)",
        padding: "var(--space-3)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ fontSize: 13 }}>Fill form — review before applying</strong>
        <button className="btn-ghost" title="Cancel" onClick={onCancel}>
          <X className="icon" size={14} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", maxHeight: 260, overflowY: "auto" }}>
        {steps.map((step) => (
          <div key={step.ref} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <input
              type="checkbox"
              checked={checked[step.ref] ?? false}
              onChange={(event) => onCheckedChange(step.ref, event.target.checked)}
            />
            <div style={{ flex: 1 }}>
              <div className="text-muted" style={{ fontSize: 11 }}>
                {step.label}
              </div>
              <input
                className="input"
                value={values[step.ref] ?? ""}
                onChange={(event) => onValueChange(step.ref, event.target.value)}
                style={{ fontSize: 12, padding: "4px 8px" }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
        <button className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={onApply} disabled={applying || checkedCount === 0}>
          {applying ? "Applying…" : `Apply ${checkedCount}`}
        </button>
      </div>
    </div>
  );
}
