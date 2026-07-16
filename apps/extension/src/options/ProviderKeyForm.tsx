import { useEffect, useState } from "react";
import type { ProviderPreset } from "@openextension/providers";
import { getProviderConfig, saveProviderConfig } from "../storage/providerRepository";

interface Props {
  preset: ProviderPreset;
}

type Status = "idle" | "saved" | "permission-denied" | "invalid-url" | "missing-key";

export default function ProviderKeyForm({ preset }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(preset.baseUrl);
  const [status, setStatus] = useState<Status>("idle");
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    getProviderConfig(preset.id).then((config) => {
      if (config?.apiKey) setApiKey(config.apiKey);
      if (config?.baseUrl) setBaseUrl(config.baseUrl);
      if (config) setIsConfigured(true);
    });
  }, [preset.id]);

  const handleSave = async () => {
    const effectiveBaseUrl = preset.editableBaseUrl ? baseUrl.trim() : preset.baseUrl;

    if (preset.requiresApiKey && !apiKey.trim()) {
      setStatus("missing-key");
      return;
    }

    let origin: string;
    try {
      origin = `${new URL(effectiveBaseUrl).origin}/*`;
    } catch {
      setStatus("invalid-url");
      return;
    }

    const granted = await chrome.permissions.request({ origins: [origin] });
    if (!granted) {
      setStatus("permission-denied");
      return;
    }

    await saveProviderConfig({
      id: preset.id,
      label: preset.label,
      apiKey: apiKey || undefined,
      baseUrl: preset.editableBaseUrl ? effectiveBaseUrl : undefined,
    });
    setIsConfigured(true);
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  };

  return (
    <div className="panel" style={{ padding: "var(--space-3) var(--space-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <span
          title={isConfigured ? "Configured" : "Not configured"}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: isConfigured ? "#22c55e" : "var(--color-border)",
            flexShrink: 0,
          }}
        />
        <label style={{ fontWeight: 600, fontSize: 14 }}>{preset.label}</label>
      </div>

      {preset.editableBaseUrl && (
        <input
          type="text"
          className="input"
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
          placeholder="https://your-endpoint.example.com/v1"
          style={{ marginTop: "var(--space-2)" }}
        />
      )}

      <input
        type="password"
        className="input"
        value={apiKey}
        onChange={(event) => setApiKey(event.target.value)}
        placeholder={preset.requiresApiKey ? "sk-..." : "API key (optional)"}
        style={{ marginTop: "var(--space-2)" }}
      />

      <div style={{ marginTop: "var(--space-2)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <button className="btn btn-primary" onClick={handleSave}>
          Save
        </button>
        {status === "saved" && <span className="text-muted">Saved.</span>}
        {status === "missing-key" && <span className="text-danger">API key is required.</span>}
        {status === "invalid-url" && <span className="text-danger">That endpoint URL doesn't look valid.</span>}
        {status === "permission-denied" && <span className="text-danger">Permission request was denied.</span>}
      </div>
    </div>
  );
}
