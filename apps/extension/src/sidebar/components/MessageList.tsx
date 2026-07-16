import type { CSSProperties } from "react";
import type { Message } from "../../storage/schema";

interface Props {
  messages: Message[];
  streamingText: string | null;
}

const bubbleStyle = (role: "user" | "assistant"): CSSProperties => ({
  alignSelf: role === "user" ? "flex-end" : "flex-start",
  background: role === "user" ? "#2563eb" : "#f1f1f1",
  color: role === "user" ? "#fff" : "#111",
  padding: "8px 12px",
  borderRadius: 8,
  maxWidth: "85%",
  whiteSpace: "pre-wrap",
});

export default function MessageList({ messages, streamingText }: Props) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {messages.map((message) => (
        <div key={message.id} style={bubbleStyle(message.role)}>
          {message.content}
        </div>
      ))}
      {streamingText !== null && <div style={bubbleStyle("assistant")}>{streamingText || "…"}</div>}
    </div>
  );
}
