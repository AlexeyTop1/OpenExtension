import { useEffect, useRef, useState } from "react";
import { createProvider, PROVIDER_PRESETS, type ChatMessage } from "@openextension/providers";
import {
  askAboutPage,
  translatePage,
  translateSelection,
  customPromptSelection,
  runAction,
  type ActionDefinition,
} from "@openextension/actions";
import { SELECTION_ACTIONS } from "@openextension/actions";
import type { ContextField, PageContext } from "@openextension/context";
import { appendMessage, createChat, getMessages, listChats, updateChat } from "../storage/chatRepository";
import { getProviderConfig } from "../storage/providerRepository";
import type { Chat, Message } from "../storage/schema";
import { pickDefaultProviderAndModel } from "./defaultProvider";
import { detectLanguageCode, getPreferredLanguage } from "./preferredLanguage";
import { consumePendingSelectionAction, onPendingSelectionAction } from "./pendingSelectionAction";
import MessageList from "./components/MessageList";
import ModelSwitcher from "./components/ModelSwitcher";
import PageActionsBar from "./components/PageActionsBar";
import PromptBox from "./components/PromptBox";

async function fetchPageContext(fields: ContextField[]): Promise<Partial<PageContext>> {
  return (await chrome.runtime.sendMessage({ type: "CONTEXT_REQUEST", fields })) as Partial<PageContext>;
}

interface PendingAction {
  action: ActionDefinition;
  page?: Partial<PageContext>;
  selection?: string;
  hint: string;
}

export default function App() {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [translateTargetLanguage, setTranslateTargetLanguage] = useState<string | null>(null);

  // The chrome.storage.onChanged subscription below is set up once (empty deps)
  // and lives for the component's whole lifetime, so any state it reads directly
  // through closures would stay frozen at whatever it was on first mount — long
  // after bootstrap() actually finishes. Refs sidestep that: the ref object is
  // stable, only `.current` changes, so even a "stale" closure sees fresh data.
  const chatRef = useRef<Chat | null>(null);
  const isSendingRef = useRef(false);
  useEffect(() => {
    chatRef.current = chat;
  }, [chat]);
  useEffect(() => {
    isSendingRef.current = isSending;
  }, [isSending]);

  useEffect(() => {
    getPreferredLanguage().then((preferred) => setTranslateTargetLanguage(preferred.label));

    (async () => {
      // bootstrap() must finish (and hand us the resolved chat directly) before we
      // act on a pending selection action: when background cold-opens the side
      // panel for a toolbar/context-menu click, this effect and bootstrap() start
      // together, and `chat` state from this render is still null — sequencing
      // alone isn't enough since setChat() only lands on a *future* render.
      const activeChat = await bootstrap();
      const pending = await consumePendingSelectionAction();
      if (pending) await handleRunSelectionAction(pending.actionId, pending.selectionText, activeChat);
    })();

    const unsubscribe = onPendingSelectionAction((pending) => {
      void handleRunSelectionAction(pending.actionId, pending.selectionText);
    });
    return unsubscribe;
  }, []);

  async function bootstrap(): Promise<Chat> {
    const chats = await listChats();
    if (chats[0]) {
      setChat(chats[0]);
      setMessages(await getMessages(chats[0].id));
      return chats[0];
    }
    const { providerId, modelId } = await pickDefaultProviderAndModel();
    const created = await createChat(providerId, modelId);
    setChat(created);
    setMessages([]);
    return created;
  }

  async function handleNewChat() {
    const { providerId, modelId } = await pickDefaultProviderAndModel();
    const created = await createChat(providerId, modelId);
    setChat(created);
    setMessages([]);
    setStreamingText(null);
    setError(null);
    setPendingAction(null);
  }

  async function handleModelChange(providerId: string, modelId: string) {
    if (!chat) return;
    const updated: Chat = { ...chat, providerId, modelId };
    setChat(updated);
    await updateChat(updated);
  }

  async function handleRunPageAction(action: ActionDefinition) {
    const page = await fetchPageContext(action.requiredFields);

    if (action.id === askAboutPage.id) {
      setPendingAction({ action, page, hint: `📄 Using page: ${page.title || page.url} — type your question below` });
      return;
    }

    if (action.id === translatePage.id) {
      const preferred = await getPreferredLanguage();
      const detected = await detectLanguageCode(page.markdown || page.title || "");
      const baseCode = preferred.code.split("-")[0];
      if (detected && detected === baseCode) {
        setPendingAction({
          action,
          page,
          hint: `🌐 This page looks like it's already in ${preferred.label} — type a target language below`,
        });
        return;
      }
      const [message] = runAction(action, { page, input: preferred.label });
      await handleSend(message.content);
      return;
    }

    const [message] = runAction(action, { page });
    await handleSend(message.content);
  }

  async function handleRunSelectionAction(actionId: string, selectionText: string, activeChat?: Chat) {
    const action = SELECTION_ACTIONS.find((candidate) => candidate.id === actionId);
    if (!action) return;

    if (action.id === customPromptSelection.id) {
      setPendingAction({ action, selection: selectionText, hint: "✂️ Using selection — type your instruction below" });
      return;
    }

    if (action.id === translateSelection.id) {
      const preferred = await getPreferredLanguage();
      const detected = await detectLanguageCode(selectionText);
      const baseCode = preferred.code.split("-")[0];
      if (detected && detected === baseCode) {
        setPendingAction({
          action,
          selection: selectionText,
          hint: `🌐 This looks like it's already in ${preferred.label} — type a target language below`,
        });
        return;
      }
      const [message] = runAction(action, { selection: selectionText, input: preferred.label });
      await handleSend(message.content, activeChat);
      return;
    }

    const [message] = runAction(action, { selection: selectionText });
    await handleSend(message.content, activeChat);
  }

  async function handleSend(text: string, activeChat?: Chat) {
    const targetChat = activeChat ?? chatRef.current;
    if (!targetChat || isSendingRef.current) return;
    setError(null);

    const preset = PROVIDER_PRESETS.find((candidate) => candidate.id === targetChat.providerId);
    const config = await getProviderConfig(targetChat.providerId);
    const isConfigured = config && (config.apiKey || !preset?.requiresApiKey);
    if (!isConfigured) {
      setError(`Configure ${preset?.label ?? targetChat.providerId} in Options first.`);
      return;
    }

    const finalText = pendingAction
      ? runAction(pendingAction.action, {
          page: pendingAction.page,
          selection: pendingAction.selection,
          input: text,
        })[0].content
      : text;
    setPendingAction(null);

    await appendMessage(targetChat.id, { role: "user", content: finalText });
    // Always reread from storage rather than trusting the `messages` closure:
    // callers reached through the long-lived storage.onChanged subscription (see
    // chatRef above) can have a stale `messages` snapshot too. appendMessage
    // already persisted the user message, so this includes it.
    const historySoFar = await getMessages(targetChat.id);
    setMessages(historySoFar);
    setIsSending(true);
    setStreamingText("");

    try {
      const provider = createProvider(targetChat.providerId, {
        id: targetChat.providerId,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
      });
      const history: ChatMessage[] = historySoFar.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      let assembled = "";
      for await (const chunk of provider.chat({ model: targetChat.modelId, messages: history })) {
        if (chunk.delta) {
          assembled += chunk.delta;
          setStreamingText(assembled);
        }
      }

      const assistantMessage = await appendMessage(targetChat.id, {
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
          gap: 8,
        }}
      >
        <strong>OpenExtension</strong>
        {chat && <ModelSwitcher chat={chat} onChange={handleModelChange} />}
        <button onClick={handleNewChat}>New chat</button>
      </header>

      <MessageList messages={messages} streamingText={streamingText} />

      {error && <div style={{ color: "#b00", padding: "0 12px", fontSize: 13 }}>{error}</div>}

      {pendingAction && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "0 12px",
            padding: "4px 8px",
            background: "#eef2ff",
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          <span>{pendingAction.hint}</span>
          <button onClick={() => setPendingAction(null)} style={{ fontSize: 12 }}>
            ×
          </button>
        </div>
      )}

      <PageActionsBar
        onRunAction={handleRunPageAction}
        disabled={isSending}
        translateTargetLanguage={translateTargetLanguage}
      />

      <PromptBox onSend={handleSend} disabled={isSending} />
    </div>
  );
}
