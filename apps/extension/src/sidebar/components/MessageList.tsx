import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import type { Message } from "../../storage/schema";

interface Props {
  messages: Message[];
  streamingText: string | null;
}

function TypingDots() {
  return (
    <span className="typing-dots">
      <span />
      <span />
      <span />
    </span>
  );
}

export default function MessageList({ messages, streamingText }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, streamingText]);

  if (messages.length === 0 && streamingText === null) {
    return (
      <div className="empty-state">
        <MessageCircle size={28} />
        <div>Ask anything, or try a Page Action below.</div>
        <div>Type “/” in the box for quick commands.</div>
      </div>
    );
  }

  return (
    <div
      className="scrollbar-thin"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "var(--space-3)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
      }}
    >
      {messages.map((message) => (
        <div key={message.id} className={`bubble bubble-${message.role}`}>
          {message.content}
        </div>
      ))}
      {streamingText !== null && (
        <div className="bubble bubble-assistant">{streamingText || <TypingDots />}</div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
