import { parseDataUrl, stripImagesForTextOnlyProvider, textOnly } from "./contentParts";
import { describeProviderError } from "./httpError";
import type {
  ChatChunk,
  ChatMessage,
  ChatRequest,
  ModelInfo,
  Provider,
  ProviderConfig,
  ProviderPreset,
} from "./types";

function toGeminiParts(content: ChatMessage["content"]) {
  if (typeof content === "string") return [{ text: content }];
  return content.map((part) => {
    if (part.type === "text") return { text: part.text };
    const { mediaType, base64 } = parseDataUrl(part.dataUrl);
    return { inlineData: { mimeType: mediaType, data: base64 } };
  });
}

interface GeminiStreamChunk {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
}

interface GeminiModelsResponse {
  models?: Array<{
    name: string;
    displayName?: string;
    supportedGenerationMethods?: string[];
  }>;
}

export class GeminiProvider implements Provider {
  readonly id: string;
  readonly label: string;
  private baseUrl: string;
  private apiKey?: string;
  private readonly fallbackModels: ModelInfo[];
  private readonly supportsVision?: false;

  constructor(preset: ProviderPreset) {
    this.id = preset.id;
    this.label = preset.label;
    this.baseUrl = preset.baseUrl;
    this.fallbackModels = preset.fallbackModels;
    this.supportsVision = preset.supportsVision;
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
      headers["x-goog-api-key"] = this.apiKey;
    }
    return headers;
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, { headers: this.headers() });
      if (!res.ok) {
        return this.fallbackModels;
      }
      const json = (await res.json()) as GeminiModelsResponse;
      const models = (json.models ?? [])
        .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
        .map((model) => ({
          id: model.name.replace(/^models\//, ""),
          label: model.displayName ?? model.name,
        }));
      return models.length ? models : this.fallbackModels;
    } catch {
      return this.fallbackModels;
    }
  }

  async *chat(request: ChatRequest): AsyncIterable<ChatChunk> {
    const systemText = request.messages
      .filter((message) => message.role === "system")
      .map((message) => textOnly(message.content))
      .join("\n\n");
    const contents = request.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts:
          this.supportsVision === false
            ? [{ text: stripImagesForTextOnlyProvider(message.content) }]
            : toGeminiParts(message.content),
      }));

    const res = await fetch(`${this.baseUrl}/models/${request.model}:streamGenerateContent?alt=sse`, {
      method: "POST",
      headers: this.headers(),
      signal: request.signal,
      body: JSON.stringify({
        contents,
        systemInstruction: systemText ? { parts: [{ text: systemText }] } : undefined,
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.maxTokens,
        },
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

        const parsed = JSON.parse(data) as GeminiStreamChunk;
        const candidate = parsed.candidates?.[0];
        const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
        if (text) {
          yield { delta: text, done: false };
        }
        if (candidate?.finishReason) {
          yield { delta: "", done: true, finishReason: candidate.finishReason };
          return;
        }
      }
    }

    yield { delta: "", done: true };
  }
}
