import { describeProviderError } from "./httpError";
import type { ChatChunk, ChatRequest, ModelInfo, Provider, ProviderConfig, ProviderPreset } from "./types";

interface OpenAIStreamChoice {
  delta?: { content?: string };
  finish_reason?: string | null;
}

interface OpenAIStreamChunk {
  choices?: OpenAIStreamChoice[];
}

interface OpenAIModelsResponse {
  data?: Array<{ id: string }>;
}

export class OpenAICompatibleProvider implements Provider {
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
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, { headers: this.headers() });
      if (!res.ok) {
        return this.fallbackModels;
      }
      const json = (await res.json()) as OpenAIModelsResponse;
      if (!json.data?.length) {
        return this.fallbackModels;
      }
      return json.data.map((model) => ({ id: model.id, label: model.id }));
    } catch {
      return this.fallbackModels;
    }
  }

  async *chat(request: ChatRequest): AsyncIterable<ChatChunk> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.headers(),
      signal: request.signal,
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
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
        if (data === "[DONE]") {
          yield { delta: "", done: true };
          return;
        }

        const parsed = JSON.parse(data) as OpenAIStreamChunk;
        const choice = parsed.choices?.[0];
        const delta = choice?.delta?.content ?? "";
        if (delta) {
          yield { delta, done: false };
        }
        if (choice?.finish_reason) {
          yield { delta: "", done: true, finishReason: choice.finish_reason };
          return;
        }
      }
    }
  }
}
