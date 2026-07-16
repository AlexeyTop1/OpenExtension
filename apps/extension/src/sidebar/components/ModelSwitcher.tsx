import { useEffect, useState } from "react";
import { createProvider, type ModelInfo, type ProviderPreset } from "@openextension/providers";
import { getProviderConfig } from "../../storage/providerRepository";
import type { Chat } from "../../storage/schema";
import { listConfiguredProviders } from "../defaultProvider";

interface Props {
  chat: Chat;
  onChange: (providerId: string, modelId: string) => void;
}

export default function ModelSwitcher({ chat, onChange }: Props) {
  const [providers, setProviders] = useState<ProviderPreset[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listConfiguredProviders().then((configured) => setProviders(configured.map((c) => c.preset)));
  }, []);

  useEffect(() => {
    void loadModels(chat.providerId);
  }, [chat.providerId]);

  async function loadModels(providerId: string): Promise<ModelInfo[]> {
    setLoading(true);
    try {
      const config = await getProviderConfig(providerId);
      const provider = createProvider(providerId, {
        id: providerId,
        apiKey: config?.apiKey,
        baseUrl: config?.baseUrl,
      });
      const fetched = await provider.listModels();
      setModels(fetched);
      return fetched;
    } finally {
      setLoading(false);
    }
  }

  async function handleProviderChange(providerId: string) {
    const fetched = await loadModels(providerId);
    onChange(providerId, fetched[0]?.id ?? "");
  }

  function handleModelChange(modelId: string) {
    onChange(chat.providerId, modelId);
  }

  return (
    <div style={{ display: "flex", gap: "var(--space-1)", alignItems: "center", minWidth: 0 }}>
      <select className="select" value={chat.providerId} onChange={(event) => handleProviderChange(event.target.value)}>
        {providers.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
      <select
        className="select"
        value={chat.modelId}
        onChange={(event) => handleModelChange(event.target.value)}
        disabled={loading || models.length === 0}
        style={{ minWidth: 0 }}
      >
        {models.length === 0 && <option value="">{loading ? "Loading…" : "No models found"}</option>}
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.label}
          </option>
        ))}
      </select>
    </div>
  );
}
