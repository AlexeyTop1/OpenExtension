import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

interface Props {
  label: string;
  variables: string[];
  onSubmit: (values: Record<string, string>) => void;
  onCancel: () => void;
}

export default function CustomPromptForm({ label, variables, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit(values);
    }
  };

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
        <strong style={{ fontSize: 13 }}>{label}</strong>
        <button className="btn-ghost" onClick={onCancel}>
          <X className="icon" size={14} />
        </button>
      </div>
      {variables.map((name, index) => (
        <input
          key={name}
          ref={index === 0 ? firstInputRef : undefined}
          className="input"
          placeholder={name}
          value={values[name] ?? ""}
          onChange={(event) => setValues((prev) => ({ ...prev, [name]: event.target.value }))}
          onKeyDown={handleKeyDown}
        />
      ))}
      <button
        className="btn btn-primary"
        style={{ alignSelf: "flex-end" }}
        onClick={() => onSubmit(values)}
      >
        Run
      </button>
    </div>
  );
}
