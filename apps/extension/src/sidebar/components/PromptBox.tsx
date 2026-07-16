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
    <div style={{ borderTop: "1px solid #e5e5e5" }}>
      {slashBody !== null && !exactMatch && suggestions.length > 0 && (
        <div style={{ padding: "6px 12px 0", display: "flex", flexDirection: "column", gap: 2 }}>
          {suggestions.map((action) => (
            <button
              key={action.id}
              onClick={() => setValue(`/${action.command} `)}
              style={{
                textAlign: "left",
                fontSize: 12,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
              }}
            >
              /{action.command} — {action.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, padding: 12 }}>
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything, or type / for commands…"
          rows={2}
          style={{ flex: 1, resize: "none", padding: 8 }}
          disabled={disabled}
        />
        <button onClick={submit} disabled={disabled}>
          Send
        </button>
      </div>
    </div>
  );
}
