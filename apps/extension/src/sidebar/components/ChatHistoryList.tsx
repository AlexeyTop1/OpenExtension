import { useState } from "react";
import { History, Pencil, Pin, Trash2 } from "lucide-react";
import type { Chat } from "../../storage/schema";

interface Props {
  chats: Chat[];
  activeChatId: string | null;
  onSelect: (chatId: string) => void;
  onDelete: (chatId: string) => void;
  onRename: (chatId: string, title: string) => void;
}

export default function ChatHistoryList({ chats, activeChatId, onSelect, onDelete, onRename }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const startRename = (chat: Chat) => {
    setEditingId(chat.id);
    setEditingTitle(chat.title);
  };

  const commitRename = (chatId: string) => {
    const title = editingTitle.trim();
    if (title) onRename(chatId, title);
    setEditingId(null);
  };

  if (chats.length === 0) {
    return (
      <div className="empty-state">
        <History size={28} />
        <div>No chats yet.</div>
      </div>
    );
  }

  return (
    <div
      className="scrollbar-thin"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "var(--space-2)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-1)",
      }}
    >
      {chats.map((chat) => (
        <div
          key={chat.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-1)",
            padding: "var(--space-1) var(--space-2)",
            borderRadius: "var(--radius-sm)",
            background: chat.id === activeChatId ? "var(--color-accent-bg)" : "transparent",
          }}
        >
          {editingId === chat.id ? (
            <input
              autoFocus
              className="input"
              value={editingTitle}
              onChange={(event) => setEditingTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitRename(chat.id);
                if (event.key === "Escape") setEditingId(null);
              }}
              onBlur={() => commitRename(chat.id)}
              style={{ flex: 1 }}
            />
          ) : (
            <button
              className="btn-ghost"
              onClick={() => onSelect(chat.id)}
              style={{
                flex: 1,
                textAlign: "left",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={chat.title}
            >
              {chat.pinnedUrl && <Pin className="icon" size={12} style={{ marginRight: 4, verticalAlign: -2 }} />}
              {chat.title}
            </button>
          )}
          <button className="btn btn-icon" onClick={() => startRename(chat)} title="Rename">
            <Pencil className="icon" size={13} />
          </button>
          <button className="btn btn-icon" onClick={() => onDelete(chat.id)} title="Delete">
            <Trash2 className="icon" size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
