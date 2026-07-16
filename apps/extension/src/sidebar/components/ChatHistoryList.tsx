import { useState } from "react";
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

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
      {chats.length === 0 && <div style={{ fontSize: 13, color: "#666" }}>No chats yet.</div>}
      {chats.map((chat) => (
        <div
          key={chat.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 8px",
            borderRadius: 6,
            background: chat.id === activeChatId ? "#eef2ff" : "transparent",
          }}
        >
          {editingId === chat.id ? (
            <input
              autoFocus
              value={editingTitle}
              onChange={(event) => setEditingTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitRename(chat.id);
                if (event.key === "Escape") setEditingId(null);
              }}
              onBlur={() => commitRename(chat.id)}
              style={{ flex: 1, fontSize: 13, padding: 4 }}
            />
          ) : (
            <button
              onClick={() => onSelect(chat.id)}
              style={{
                flex: 1,
                textAlign: "left",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                padding: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={chat.title}
            >
              {chat.pinnedUrl ? "📌 " : ""}
              {chat.title}
            </button>
          )}
          <button onClick={() => startRename(chat)} title="Rename" style={{ fontSize: 12 }}>
            ✎
          </button>
          <button onClick={() => onDelete(chat.id)} title="Delete" style={{ fontSize: 12 }}>
            🗑
          </button>
        </div>
      ))}
    </div>
  );
}
