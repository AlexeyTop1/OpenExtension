import { useState, type KeyboardEvent } from "react";

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
}

export default function PromptBox({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
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
    <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #e5e5e5" }}>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything…"
        rows={2}
        style={{ flex: 1, resize: "none", padding: 8 }}
        disabled={disabled}
      />
      <button onClick={submit} disabled={disabled}>
        Send
      </button>
    </div>
  );
}
