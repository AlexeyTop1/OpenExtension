import { useEffect, useState } from "react";
import { createProvider, PROVIDER_PRESETS, type ChatMessage } from "@openextension/providers";
import { appendMessage, createChat, getMessages, listChats } from "../storage/chatRepository";
import { getProviderConfig } from "../storage/providerRepository";
import type { Chat, Message } from "../storage/schema";
import { pickDefaultProviderAndModel } from "./defaultProvider";
import MessageList from "./components/MessageList";
import PromptBox from "./components/PromptBox";

export default function App() {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    const chats = await listChats();
    if (chats[0]) {
      setChat(chats[0]);
      setMessages(await getMessages(chats[0].id));
      return;
    }
    const { providerId, modelId } = await pickDefaultProviderAndModel();
    const created = await createChat(providerId, modelId);
    setChat(created);
    setMessages([]);
  }

  async function handleNewChat() {
    const { providerId, modelId } = await pickDefaultProviderAndModel();
    const created = await createChat(providerId, modelId);
    setChat(created);
    setMessages([]);
    setStreamingText(null);
    setError(null);
  }

  async function handleSend(text: string) {
    if (!chat || isSending) return;
    setError(null);

    const config = await getProviderConfig(chat.providerId);
    if (!config?.apiKey) {
      const label = PROVIDER_PRESETS.find((preset) => preset.id === chat.providerId)?.label ?? chat.providerId;
      setError(`Add your ${label} API key in Options first.`);
      return;
    }

    const userMessage = await appendMessage(chat.id, { role: "user", content: text });
    const historySoFar = [...messages, userMessage];
    setMessages(historySoFar);
    setIsSending(true);
    setStreamingText("");

    try {
      const provider = createProvider(chat.providerId, { id: chat.providerId, apiKey: config.apiKey });
      const history: ChatMessage[] = historySoFar.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      let assembled = "";
      for await (const chunk of provider.chat({ model: chat.modelId, messages: history })) {
        if (chunk.delta) {
          assembled += chunk.delta;
          setStreamingText(assembled);
        }
      }

      const assistantMessage = await appendMessage(chat.id, {
        role: "assistant",
        content: assembled,
      });
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setStreamingText(null);
      setIsSending(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        <strong>OpenExtension</strong>
        <button onClick={handleNewChat}>New chat</button>
      </header>

      <MessageList messages={messages} streamingText={streamingText} />

      {error && <div style={{ color: "#b00", padding: "0 12px", fontSize: 13 }}>{error}</div>}

      <PromptBox onSend={handleSend} disabled={isSending} />
    </div>
  );
}
