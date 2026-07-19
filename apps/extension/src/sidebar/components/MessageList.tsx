import { useEffect, useRef, useState } from "react";
import { Check, Copy, MessageCircle, RotateCcw, Replace } from "lucide-react";
import { textOnly } from "@openextension/providers";
import type { Message } from "../../storage/schema";

function renderContent(content: Message["content"]) {
  if (typeof content === "string") return content;
  return content.map((part, index) =>
    part.type === "text" ? (
      <span key={index}>{part.text}</span>
    ) : (
      <img
        key={index}
        src={part.dataUrl}
        alt=""
        style={{ maxWidth: "100%", borderRadius: "var(--radius-md)", display: "block", marginTop: "var(--space-1)" }}
      />
    ),
  );
}

interface Props {
  messages: Message[];
  streamingText: string | null;
  onRegenerate: () => void;
  replaceableMessageId: string | null;
  replaceLabel?: string;
  onReplace: (messageId: string, text: string) => void;
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="btn-ghost"
      style={{ padding: 2 }}
      title="Copy"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? <Check className="icon" size={12} /> : <Copy className="icon" size={12} />}
    </button>
  );
}

export default function MessageList({
  messages,
  streamingText,
  onRegenerate,
  replaceableMessageId,
  replaceLabel = "Replace on page",
  onReplace,
}: Props) {
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
      {messages.map((message, index) => {
        const isLastAssistantReply =
          index === messages.length - 1 && message.role === "assistant" && streamingText === null;

        return (
          <div
            key={message.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: message.role === "user" ? "flex-end" : "flex-start",
              gap: 2,
            }}
          >
            <div className={`bubble bubble-${message.role}`}>{renderContent(message.content)}</div>
            <div style={{ display: "flex", gap: 2 }}>
              <CopyButton text={textOnly(message.content)} />
              {isLastAssistantReply && (
                <button className="btn-ghost" style={{ padding: 2 }} title="Regenerate" onClick={onRegenerate}>
                  <RotateCcw className="icon" size={12} />
                </button>
              )}
              {message.id === replaceableMessageId && (
                <button
                  className="btn-ghost"
                  style={{ padding: "2px 6px", fontSize: 11 }}
                  title={replaceLabel}
                  onClick={() => onReplace(message.id, textOnly(message.content))}
                >
                  <Replace className="icon" size={12} /> {replaceLabel}
                </button>
              )}
            </div>
          </div>
        );
      })}
      {streamingText !== null && (
        <div className="bubble bubble-assistant">{streamingText || <TypingDots />}</div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
