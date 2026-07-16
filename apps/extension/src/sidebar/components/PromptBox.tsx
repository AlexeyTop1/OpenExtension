import { useMemo, useState, type KeyboardEvent } from "react";
import type { ActionDefinition } from "@openextension/actions";

interface Props {
  onSend: (text: string) => void;
  onCommand: (action: ActionDefinition, argument: string) => void;
  commands: ActionDefinition[];
  disabled: boolean;
}

export default function PromptBox({ onSend, onCommand, commands, disabled }: Props) {
  const [value, setValue] = useState("");

  const slashBody = value.startsWith("/") ? value.slice(1) : null;
  const [typedCommand, ...rest] = slashBody?.split(" ") ?? [];
  const argument = rest.join(" ");

  const suggestions = useMemo(() => {
    if (slashBody === null) return [];
    return commands.filter((action) => action.command?.startsWith(typedCommand.toLowerCase()));
  }, [slashBody, typedCommand, commands]);

  const exactMatch = commands.find((action) => action.command === typedCommand?.toLowerCase());

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;

    if (slashBody !== null && exactMatch) {
      onCommand(exactMatch, argument.trim());
      setValue("");
      return;
    }

    onSend(text);
    setValue("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
      {slashBody !== null && !exactMatch && suggestions.length > 0 && (
        <div
          className="panel"
          style={{
            margin: "var(--space-2) var(--space-3) 0",
            padding: "var(--space-1)",
            display: "flex",
            flexDirection: "column",
            background: "var(--color-bg)",
          }}
        >
          {suggestions.map((action) => (
            <button
              key={action.id}
              className="btn-ghost"
              onClick={() => setValue(`/${action.command} `)}
              style={{ textAlign: "left", fontSize: 12, width: "100%" }}
            >
              <strong>/{action.command}</strong>&nbsp;<span className="text-muted">— {action.label}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--space-2)", padding: "var(--space-3)" }}>
        <textarea
          className="input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything, or type / for commands…"
          rows={2}
          style={{ flex: 1, resize: "none" }}
          disabled={disabled}
        />
        <button className="btn btn-primary" onClick={submit} disabled={disabled}>
          Send
        </button>
      </div>
    </div>
  );
}
