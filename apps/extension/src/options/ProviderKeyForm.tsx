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

  useEffect(() => {
    getProviderConfig(preset.id).then((config) => {
      if (config?.apiKey) setApiKey(config.apiKey);
      if (config?.baseUrl) setBaseUrl(config.baseUrl);
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
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  };

  return (
    <div style={{ marginTop: 24 }}>
      <label style={{ display: "block", fontWeight: 600 }}>{preset.label}</label>

      {preset.editableBaseUrl && (
        <input
          type="text"
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
          placeholder="https://your-endpoint.example.com/v1"
          style={{ width: "100%", padding: 8, marginTop: 6, boxSizing: "border-box" }}
        />
      )}

      <input
        type="password"
        value={apiKey}
        onChange={(event) => setApiKey(event.target.value)}
        placeholder={preset.requiresApiKey ? "sk-..." : "API key (optional)"}
        style={{ width: "100%", padding: 8, marginTop: 6, boxSizing: "border-box" }}
      />

      <div style={{ marginTop: 8 }}>
        <button onClick={handleSave} style={{ padding: "8px 16px" }}>
          Save
        </button>
        {status === "saved" && <span style={{ marginLeft: 8 }}>Saved.</span>}
        {status === "missing-key" && (
          <span style={{ marginLeft: 8, color: "#b00" }}>API key is required.</span>
        )}
        {status === "invalid-url" && (
          <span style={{ marginLeft: 8, color: "#b00" }}>That endpoint URL doesn't look valid.</span>
        )}
        {status === "permission-denied" && (
          <span style={{ marginLeft: 8, color: "#b00" }}>Permission request was denied.</span>
        )}
      </div>
    </div>
  );
}
