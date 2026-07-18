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
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import { createProvider, PROVIDER_PRESETS, type ChatMessage, type MessageContentPart } from "@openextension/providers";
import {
  askAboutPage,
  translatePage,
  translateSelection,
  customPromptSelection,
  summarizeYoutube,
  runAction,
  PAGE_ACTIONS,
  IMAGE_ACTIONS,
  type ActionDefinition,
} from "@openextension/actions";
import { SELECTION_ACTIONS } from "@openextension/actions";
import { isYoutubeWatchUrl, type ContextField, type PageContext } from "@openextension/context";
import {
  appendMessage,
  createChat,
  deleteChat,
  deleteMessage,
  getMessages,
  listChats,
  updateChat,
} from "../storage/chatRepository";
import { getProviderConfig } from "../storage/providerRepository";
import type { Chat, Message } from "../storage/schema";
import { pickDefaultProviderAndModel } from "./defaultProvider";
import { detectLanguageCode, getPreferredLanguage } from "./preferredLanguage";
import { consumePendingSelectionAction, onPendingSelectionAction } from "./pendingSelectionAction";
import type { PendingSelectionAction } from "../shared/pendingSelectionAction";
import { consumePendingImageAction, onPendingImageAction } from "./pendingImageAction";
import type { PendingImageAction } from "../shared/pendingImageAction";
import type { FetchImageDataUrlResponse } from "../shared/messaging/types";
import { normalizeUrl } from "./normalizeUrl";
import { parsePdfBytes } from "../shared/pdfParse";
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
  const [replaceTarget, setReplaceTarget] = useState<{ messageId: string; tabId: number } | null>(null);
  const [pendingLocalPdf, setPendingLocalPdf] = useState<{
    fileName: string;
    page: Partial<PageContext>;
    action: ActionDefinition;
    argumentOverride?: string;
  } | null>(null);
  const localPdfInputRef = useRef<HTMLInputElement | null>(null);
  // Keyed by page URL so re-running an action (or a different Page Action) on
  // the same local PDF doesn't ask the user to re-pick the file — cleared
  // when the side panel closes, which is an acceptable "for this session" scope.
  const localPdfTextCacheRef = useRef<Map<string, string>>(new Map());

  const activeTabUrl = useActiveTabUrl();
  const normalizedCurrentUrl = activeTabUrl ? normalizeUrl(activeTabUrl) : null;
  const contextualActions = activeTabUrl && isYoutubeWatchUrl(activeTabUrl) ? [summarizeYoutube] : [];
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
  const abortControllerRef = useRef<AbortController | null>(null);
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
      const pendingSelection = await consumePendingSelectionAction();
      if (pendingSelection) await handleRunSelectionAction(pendingSelection, activeChat);
      const pendingImage = await consumePendingImageAction();
      if (pendingImage) await handleRunImageAction(pendingImage, activeChat);
    })();

    const unsubscribeSelection = onPendingSelectionAction((pending) => {
      void handleRunSelectionAction(pending);
    });
    const unsubscribeImage = onPendingImageAction((pending) => {
      void handleRunImageAction(pending);
    });
    return () => {
      unsubscribeSelection();
      unsubscribeImage();
    };
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
    setReplaceTarget(null);
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
    setReplaceTarget(null);
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

    if (page.localPdfName) {
      const cached = page.url ? localPdfTextCacheRef.current.get(page.url) : undefined;
      if (cached) {
        await runPageActionWithContext(action, { ...page, markdown: cached }, argumentOverride);
        return;
      }
      // No extension context can read a local file's bytes without the user
      // manually flipping "Allow access to file URLs" — instead, ask them to
      // pick the same file via a normal <input type="file">, which needs no
      // special permission at all.
      setPendingLocalPdf({ fileName: page.localPdfName, page, action, argumentOverride });
      return;
    }

    await runPageActionWithContext(action, page, argumentOverride);
  }

  async function handleLocalPdfFileSelected(file: File) {
    if (!pendingLocalPdf) return;
    const { page, action, argumentOverride } = pendingLocalPdf;
    setPendingLocalPdf(null);
    try {
      const text = await parsePdfBytes(await file.arrayBuffer());
      if (!text) {
        setError("Couldn't find any text in that PDF — it might be a scanned/image-only document.");
        return;
      }
      if (page.url) localPdfTextCacheRef.current.set(page.url, text);
      await runPageActionWithContext(action, { ...page, markdown: text }, argumentOverride);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Couldn't read that PDF.");
    }
  }

  async function runPageActionWithContext(
    action: ActionDefinition,
    page: Partial<PageContext>,
    argumentOverride?: string,
  ) {
    if (action.id === summarizeYoutube.id && !page.youtubeTranscript) {
      setError("This video doesn't have captions available, so it can't be summarized from a transcript.");
      return;
    }

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

  async function handleRunSelectionAction(pending: PendingSelectionAction, activeChat?: Chat) {
    const { actionId, selectionText, tabId, isReplaceable } = pending;
    const action = SELECTION_ACTIONS.find((candidate) => candidate.id === actionId);
    if (!action) return;

    const maybeRememberReplaceTarget = (assistantMessage: Message | null) => {
      if (assistantMessage && isReplaceable && action.supportsReplace) {
        setReplaceTarget({ messageId: assistantMessage.id, tabId });
      }
    };

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
      maybeRememberReplaceTarget(await handleSend(message.content, activeChat));
      return;
    }

    const [message] = runAction(action, { selection: selectionText });
    maybeRememberReplaceTarget(await handleSend(message.content, activeChat));
  }

  async function handleRunImageAction(pending: PendingImageAction, activeChat?: Chat) {
    const { actionId, imageUrl, tabId } = pending;
    const action = IMAGE_ACTIONS.find((candidate) => candidate.id === actionId);
    if (!action) return;

    const targetChat = activeChat ?? chatRef.current;
    const preset = targetChat && PROVIDER_PRESETS.find((candidate) => candidate.id === targetChat.providerId);
    if (preset && preset.supportsVision === false) {
      setError(`${preset.label} doesn't support image input — switch to OpenAI, Anthropic, or Gemini for image actions.`);
      return;
    }

    let response: FetchImageDataUrlResponse;
    try {
      response = (await chrome.tabs.sendMessage(tabId, {
        type: "FETCH_IMAGE_DATA_URL",
        imageUrl,
      })) as FetchImageDataUrlResponse;
    } catch {
      setError("Couldn't reach that page to read the image — try again.");
      return;
    }
    if ("error" in response) {
      setError(response.error);
      return;
    }

    const [message] = runAction(action, { image: { dataUrl: response.dataUrl } });
    await handleSend(message.content, activeChat);
  }

  async function handleReplace(messageId: string, text: string) {
    if (!replaceTarget || replaceTarget.messageId !== messageId) return;
    try {
      const ok = await chrome.tabs.sendMessage(replaceTarget.tabId, { type: "REPLACE_SELECTION", text });
      if (!ok) setError("Couldn't find that text on the page anymore — try selecting it again.");
    } catch {
      setError("Couldn't reach that page anymore — try selecting the text again.");
    } finally {
      setReplaceTarget(null);
    }
  }

  async function streamAssistantReply(targetChat: Chat, history: ChatMessage[]): Promise<Message | null> {
    setIsSending(true);
    setStreamingText("");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let assembled = "";
    let result: Message | null = null;
    try {
      const config = await getProviderConfig(targetChat.providerId);
      const provider = createProvider(targetChat.providerId, {
        id: targetChat.providerId,
        apiKey: config?.apiKey,
        baseUrl: config?.baseUrl,
      });

      for await (const chunk of provider.chat({
        model: targetChat.modelId,
        messages: history,
        signal: controller.signal,
      })) {
        if (chunk.delta) {
          assembled += chunk.delta;
          setStreamingText(assembled);
        }
      }

      result = await appendMessage(targetChat.id, { role: "assistant", content: assembled });
      setMessages((prev) => [...prev, result!]);
    } catch (err) {
      const wasStopped = err instanceof DOMException && err.name === "AbortError";
      if (wasStopped) {
        // Keep whatever was streamed before Stop was pressed, rather than
        // discarding a partial (but possibly still useful) reply.
        if (assembled) {
          result = await appendMessage(targetChat.id, { role: "assistant", content: assembled });
          setMessages((prev) => [...prev, result!]);
        }
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setStreamingText(null);
      setIsSending(false);
      abortControllerRef.current = null;
      void refreshChats();
    }
    return result;
  }

  function handleStop() {
    abortControllerRef.current?.abort();
  }

  async function handleRegenerate() {
    const targetChat = chatRef.current;
    if (!targetChat || isSendingRef.current) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;

    const remaining = await deleteMessage(targetChat.id, last.id);
    setMessages(remaining);

    const history: ChatMessage[] = remaining.map((message) => ({
      role: message.role,
      content: message.content,
    }));
    await streamAssistantReply(targetChat, history);
  }

  async function handleSend(text: string | MessageContentPart[], activeChat?: Chat): Promise<Message | null> {
    const targetChat = activeChat ?? chatRef.current;
    if (!targetChat || isSendingRef.current) return null;
    setError(null);

    const preset = PROVIDER_PRESETS.find((candidate) => candidate.id === targetChat.providerId);
    const config = await getProviderConfig(targetChat.providerId);
    const isConfigured = config && (config.apiKey || !preset?.requiresApiKey);
    if (!isConfigured) {
      setError(`Configure ${preset?.label ?? targetChat.providerId} in Options first.`);
      return null;
    }

    const finalContent =
      pendingAction && typeof text === "string"
        ? runAction(pendingAction.action, {
            page: pendingAction.page,
            selection: pendingAction.selection,
            input: text,
          })[0].content
        : text;
    setPendingAction(null);

    await appendMessage(targetChat.id, { role: "user", content: finalContent });
    // Always reread from storage rather than trusting the `messages` closure:
    // callers reached through the long-lived storage.onChanged subscription (see
    // chatRef above) can have a stale `messages` snapshot too. appendMessage
    // already persisted the user message, so this includes it.
    const historySoFar = await getMessages(targetChat.id);
    setMessages(historySoFar);

    const history: ChatMessage[] = historySoFar.map((message) => ({
      role: message.role,
      content: message.content,
    }));
    return streamAssistantReply(targetChat, history);
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

          <MessageList
            messages={messages}
            streamingText={streamingText}
            onRegenerate={handleRegenerate}
            replaceableMessageId={replaceTarget?.messageId ?? null}
            onReplace={handleReplace}
          />

          {error && (
            <div className="text-danger" style={{ padding: "0 var(--space-3)", fontSize: 13 }}>
              {error}
            </div>
          )}

          {pendingLocalPdf && (
            <div className="chip chip-info" style={{ margin: "0 var(--space-3)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
                <Upload className="icon" size={14} />
                Local PDF — pick "{pendingLocalPdf.fileName}" to read it (nothing leaves your device except the
                extracted text, sent only when you run an action)
              </span>
              <div style={{ display: "inline-flex", gap: "var(--space-2)" }}>
                <button className="btn-ghost" onClick={() => localPdfInputRef.current?.click()}>
                  Choose file
                </button>
                <button className="btn-ghost" onClick={() => setPendingLocalPdf(null)}>
                  <X className="icon" size={14} />
                </button>
              </div>
            </div>
          )}
          <input
            ref={localPdfInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void handleLocalPdfFileSelected(file);
            }}
          />

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
            extraActions={contextualActions}
          />

          <PromptBox
            onSend={handleSend}
            onCommand={handleSlashCommand}
            onStop={handleStop}
            commands={[...contextualActions, ...PAGE_ACTIONS]}
            disabled={isSending}
          />
        </>
      )}
    </div>
  );
}
