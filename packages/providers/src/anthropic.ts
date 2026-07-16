import { describeProviderError } from "./httpError";
import type {
  ChatChunk,
  ChatRequest,
  ModelInfo,
  Provider,
  ProviderConfig,
  ProviderPreset,
} from "./types";

const ANTHROPIC_VERSION = "2023-06-01";

interface AnthropicStreamEvent {
  type: string;
  delta?: { type?: string; text?: string; stop_reason?: string | null };
}

interface AnthropicModelsResponse {
  data?: Array<{ id: string; display_name?: string }>;
}

export class AnthropicProvider implements Provider {
  readonly id: string;
  readonly label: string;
  private baseUrl: string;
  private apiKey?: string;
  private readonly fallbackModels: ModelInfo[];

  constructor(preset: ProviderPreset) {
    this.id = preset.id;
    this.label = preset.label;
    this.baseUrl = preset.baseUrl;
    this.fallbackModels = preset.fallbackModels;
  }

  configure(config: ProviderConfig): void {
    this.apiKey = config.apiKey;
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    }
  }

  private headers(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "anthropic-version": ANTHROPIC_VERSION,
      // Anthropic's API blocks browser-origin requests by default (to discourage
      // shipping API keys to end users); this header is required to call it
      // directly from an extension page instead of through a backend proxy.
      "anthropic-dangerous-direct-browser-access": "true",
      ...(this.apiKey ? { "x-api-key": this.apiKey } : {}),
    };
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, { headers: this.headers() });
      if (!res.ok) {
        return this.fallbackModels;
      }
      const json = (await res.json()) as AnthropicModelsResponse;
      if (!json.data?.length) {
        return this.fallbackModels;
      }
      return json.data.map((model) => ({ id: model.id, label: model.display_name ?? model.id }));
    } catch {
      return this.fallbackModels;
    }
  }

  async *chat(request: ChatRequest): AsyncIterable<ChatChunk> {
    const systemText = request.messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n\n");
    const conversation = request.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({ role: message.role, content: message.content }));

    const res = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: this.headers(),
      signal: request.signal,
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.maxTokens ?? 4096,
        temperature: request.temperature,
        system: systemText || undefined,
        messages: conversation,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      throw new Error(describeProviderError(this.label, res.status, text));
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const data = trimmed.slice("data:".length).trim();
        if (!data) continue;

        const event = JSON.parse(data) as AnthropicStreamEvent;

        if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
          yield { delta: event.delta.text ?? "", done: false };
        } else if (event.type === "message_stop") {
          yield { delta: "", done: true };
          return;
        }
      }
    }
  }
}
