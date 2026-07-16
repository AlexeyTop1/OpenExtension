import { storageGet, storageRemove, storageSet } from "./local";
import type { Chat, Message } from "./schema";

const CHATS_KEY = "chats";
const messagesKey = (chatId: string) => `msgs_${chatId}`;

export async function listChats(): Promise<Chat[]> {
  return (await storageGet<Chat[]>(CHATS_KEY)) ?? [];
}

export async function createChat(providerId: string, modelId: string): Promise<Chat> {
  const chat: Chat = {
    id: crypto.randomUUID(),
    title: "New chat",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    providerId,
    modelId,
    pinnedUrl: null,
  };
  const chats = await listChats();
  chats.unshift(chat);
  await storageSet(CHATS_KEY, chats);
  await storageSet(messagesKey(chat.id), [] satisfies Message[]);
  return chat;
}

export async function updateChat(updated: Chat): Promise<void> {
  const chats = await listChats();
  const index = chats.findIndex((candidate) => candidate.id === updated.id);
  if (index !== -1) {
    chats[index] = updated;
    await storageSet(CHATS_KEY, chats);
  }
}

export async function deleteChat(chatId: string): Promise<void> {
  const chats = await listChats();
  await storageSet(
    CHATS_KEY,
    chats.filter((candidate) => candidate.id !== chatId),
  );
  await storageRemove(messagesKey(chatId));
}

export async function getMessages(chatId: string): Promise<Message[]> {
  return (await storageGet<Message[]>(messagesKey(chatId))) ?? [];
}

export async function deleteMessage(chatId: string, messageId: string): Promise<Message[]> {
  const messages = await getMessages(chatId);
  const remaining = messages.filter((candidate) => candidate.id !== messageId);
  await storageSet(messagesKey(chatId), remaining);
  return remaining;
}

export async function appendMessage(
  chatId: string,
  message: Pick<Message, "role" | "content">,
): Promise<Message> {
  const full: Message = {
    id: crypto.randomUUID(),
    chatId,
    createdAt: Date.now(),
    ...message,
  };

  const messages = await getMessages(chatId);
  messages.push(full);
  await storageSet(messagesKey(chatId), messages);

  const chats = await listChats();
  const chat = chats.find((candidate) => candidate.id === chatId);
  if (chat) {
    chat.updatedAt = Date.now();
    if (chat.title === "New chat" && message.role === "user") {
      chat.title = message.content.slice(0, 60);
    }
    await storageSet(CHATS_KEY, chats);
  }

  return full;
}
