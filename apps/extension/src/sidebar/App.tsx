import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  FileText,
  History,
  Languages,
  Pin,
  Plus,
  Puzzle,
  Scissors,
  X,
  type LucideIcon,
} from "lucide-react";
import { createProvider, PROVIDER_PRESETS, type ChatMessage } from "@openextension/providers";
import {
  askAboutPage,
  translatePage,
  translateSelection,
  customPromptSelection,
  runAction,
  PAGE_ACTIONS,
  type ActionDefinition,
} from "@openextension/actions";
import { SELECTION_ACTIONS } from "@openextension/actions";
import type { ContextField, PageContext } from "@openextension/context";
import {
  appendMessage,
  createChat,
  deleteChat,
  getMessages,
  listChats,
  updateChat,
} from "../storage/chatRepository";
import { getProviderConfig } from "../storage/providerRepository";
import type { Chat, Message } from "../storage/schema";
import { pickDefaultProviderAndModel } from "./defaultProvider";
import { detectLanguageCode, getPreferredLanguage } from "./preferredLanguage";
import { consumePendingSelectionAction, onPendingSelectionAction } from "./pendingSelectionAction";
import { normalizeUrl } from "./normalizeUrl";
import { useActiveTabUrl } from "./useActiveTabUrl";
import ChatHistoryList from "./components/ChatHistoryList";
import MessageList from "./components/MessageList";
import ModelSwitcher from "./components/ModelSwitcher";
import PageActionsBar from "./components/PageActionsBar";
import PinBanner from "./components/PinBanner";
import PromptBox from "./components/PromptBox";

async function fetchPageContext(fields: ContextField[]): Promise<Partial<PageContext>> {
  return (await chrome.runtime.sendMessage({ type: "CONTEXT_REQUEST", fields })) as Partial<PageContext>;
}

interface PendingAction {
  action: ActionDefinition;
  page?: Partial<PageContext>;
  selection?: string;
  hint: string;
  icon: LucideIcon;
}

export default function App() {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [translateTargetLanguage, setTranslateTargetLanguage] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [dismissedPinId, setDismissedPinId] = useState<string | null>(null);

  const activeTabUrl = useActiveTabUrl();
  const normalizedCurrentUrl = activeTabUrl ? normalizeUrl(activeTabUrl) : null;
  const pinnedChat = normalizedCurrentUrl
    ? chats.find((candidate) => candidate.pinnedUrl === normalizedCurrentUrl && candidate.id !== chat?.id)
    : undefined;
  const showPinBanner = pinnedChat && pinnedChat.id !== dismissedPinId;

  useEffect(() => {
    setDismissedPinId(null);
  }, [normalizedCurrentUrl]);

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

  async function refreshChats(): Promise<Chat[]> {
    const all = await listChats();
    setChats(all);
    return all;
  }

  async function bootstrap(): Promise<Chat> {
    const all = await refreshChats();
    if (all[0]) {
      setChat(all[0]);
      setMessages(await getMessages(all[0].id));
      return all[0];
    }
    const { providerId, modelId } = await pickDefaultProviderAndModel();
    const created = await createChat(providerId, modelId);
    setChat(created);
    setMessages([]);
    await refreshChats();
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
    setShowHistory(false);
    await refreshChats();
  }

  async function handleSelectChat(chatId: string) {
    const target = chats.find((candidate) => candidate.id === chatId);
    if (!target) return;
    setChat(target);
    setMessages(await getMessages(chatId));
    setStreamingText(null);
    setError(null);
    setPendingAction(null);
    setShowHistory(false);
  }

  async function handleDeleteChat(chatId: string) {
    await deleteChat(chatId);
    const remaining = await refreshChats();

    if (chat?.id !== chatId) return;

    if (remaining[0]) {
      setChat(remaining[0]);
      setMessages(await getMessages(remaining[0].id));
      return;
    }
    const { providerId, modelId } = await pickDefaultProviderAndModel();
    const created = await createChat(providerId, modelId);
    setChat(created);
    setMessages([]);
    await refreshChats();
  }

  async function handleRenameChat(chatId: string, title: string) {
    const target = chats.find((candidate) => candidate.id === chatId);
    if (!target) return;
    const updated: Chat = { ...target, title };
    await updateChat(updated);
    if (chat?.id === chatId) setChat(updated);
    await refreshChats();
  }

  async function handlePinToggle() {
    if (!chat || !normalizedCurrentUrl) return;
    const updated: Chat = { ...chat, pinnedUrl: chat.pinnedUrl ? null : normalizedCurrentUrl };
    setChat(updated);
    await updateChat(updated);
    await refreshChats();
  }

  async function handleModelChange(providerId: string, modelId: string) {
    if (!chat) return;
    const updated: Chat = { ...chat, providerId, modelId };
    setChat(updated);
    await updateChat(updated);
  }

  async function handleRunPageAction(action: ActionDefinition, argumentOverride?: string) {
    const page = await fetchPageContext(action.requiredFields);

    if (action.id === askAboutPage.id) {
      if (argumentOverride) {
        const [message] = runAction(action, { page, input: argumentOverride });
        await handleSend(message.content);
        return;
      }
      setPendingAction({
        action,
        page,
        icon: FileText,
        hint: `Using page: ${page.title || page.url} — type your question below`,
      });
      return;
    }

    if (action.id === translatePage.id) {
      if (argumentOverride) {
        const [message] = runAction(action, { page, input: argumentOverride });
        await handleSend(message.content);
        return;
      }
      const preferred = await getPreferredLanguage();
      const detected = await detectLanguageCode(page.markdown || page.title || "");
      const baseCode = preferred.code.split("-")[0];
      if (detected && detected === baseCode) {
        setPendingAction({
          action,
          page,
          icon: Languages,
          hint: `This page looks like it's already in ${preferred.label} — type a target language below`,
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

  // Third entry point into the same PAGE_ACTIONS used by the button bar and
  // (via SELECTION_ACTIONS) the toolbar/context menu — proves actions are
  // decoupled from how they're triggered.
  function handleSlashCommand(action: ActionDefinition, argument: string) {
    void handleRunPageAction(action, argument || undefined);
  }

  async function handleRunSelectionAction(actionId: string, selectionText: string, activeChat?: Chat) {
    const action = SELECTION_ACTIONS.find((candidate) => candidate.id === actionId);
    if (!action) return;

    if (action.id === customPromptSelection.id) {
      setPendingAction({
        action,
        selection: selectionText,
        icon: Scissors,
        hint: "Using selection — type your instruction below",
      });
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
          icon: Languages,
          hint: `This looks like it's already in ${preferred.label} — type a target language below`,
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
      void refreshChats();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
          padding: "var(--space-3)",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-bg-subtle)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-2)" }}>
          <strong style={{ fontSize: 14, display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
            <Puzzle className="icon" size={16} /> OpenExtension
          </strong>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button className="btn btn-icon" onClick={() => setShowHistory((prev) => !prev)}>
              {showHistory ? (
                <>
                  <ChevronLeft className="icon" size={14} /> Back
                </>
              ) : (
                <>
                  <History className="icon" size={14} /> History
                </>
              )}
            </button>
            <button className="btn btn-icon btn-primary" onClick={handleNewChat}>
              <Plus className="icon" size={14} /> New chat
            </button>
          </div>
        </div>

        {!showHistory && chat && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-2)" }}>
            <ModelSwitcher chat={chat} onChange={handleModelChange} />
            <button className="btn btn-icon" onClick={handlePinToggle} disabled={!normalizedCurrentUrl}>
              <Pin className="icon" size={14} fill={chat.pinnedUrl ? "currentColor" : "none"} />
              {chat.pinnedUrl ? "Pinned" : "Pin"}
            </button>
          </div>
        )}
      </header>

      {showHistory ? (
        <ChatHistoryList
          chats={[...chats].sort((a, b) => b.updatedAt - a.updatedAt)}
          activeChatId={chat?.id ?? null}
          onSelect={handleSelectChat}
          onDelete={handleDeleteChat}
          onRename={handleRenameChat}
        />
      ) : (
        <>
          {showPinBanner && pinnedChat && (
            <PinBanner
              title={pinnedChat.title}
              onResume={() => handleSelectChat(pinnedChat.id)}
              onDismiss={() => setDismissedPinId(pinnedChat.id)}
            />
          )}

          <MessageList messages={messages} streamingText={streamingText} />

          {error && (
            <div className="text-danger" style={{ padding: "0 var(--space-3)", fontSize: 13 }}>
              {error}
            </div>
          )}

          {pendingAction && (
            <div className="chip chip-info" style={{ margin: "0 var(--space-3)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
                <pendingAction.icon className="icon" size={14} />
                {pendingAction.hint}
              </span>
              <button className="btn-ghost" onClick={() => setPendingAction(null)}>
                <X className="icon" size={14} />
              </button>
            </div>
          )}

          <PageActionsBar
            onRunAction={handleRunPageAction}
            disabled={isSending}
            translateTargetLanguage={translateTargetLanguage}
          />

          <PromptBox
            onSend={handleSend}
            onCommand={handleSlashCommand}
            commands={PAGE_ACTIONS}
            disabled={isSending}
          />
        </>
      )}
    </div>
  );
}
