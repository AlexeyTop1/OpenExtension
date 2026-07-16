import { useEffect, useState } from "react";
import type { OpenAICompatiblePreset } from "@openextension/providers";
import { getProviderConfig, saveProviderConfig } from "../storage/providerRepository";

interface Props {
  preset: OpenAICompatiblePreset;
}

export default function ProviderKeyForm({ preset }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "permission-denied">("idle");
  const origin = `${new URL(preset.baseUrl).origin}/*`;

  useEffect(() => {
    getProviderConfig(preset.id).then((config) => {
      if (config?.apiKey) {
        setApiKey(config.apiKey);
      }
    });
  }, [preset.id]);

  const handleSave = async () => {
    const granted = await chrome.permissions.request({ origins: [origin] });
    if (!granted) {
      setStatus("permission-denied");
      return;
    }
    await saveProviderConfig({ id: preset.id, label: preset.label, apiKey });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  };

  return (
    <div style={{ marginTop: 24 }}>
      <label style={{ display: "block", fontWeight: 600 }}>{preset.label} API key</label>
      <input
        type="password"
        value={apiKey}
        onChange={(event) => setApiKey(event.target.value)}
        placeholder="sk-..."
        style={{ width: "100%", padding: 8, marginTop: 4, boxSizing: "border-box" }}
      />
      <div style={{ marginTop: 8 }}>
        <button onClick={handleSave} style={{ padding: "8px 16px" }}>
          Save
        </button>
        {status === "saved" && <span style={{ marginLeft: 8 }}>Saved.</span>}
        {status === "permission-denied" && (
          <span style={{ marginLeft: 8, color: "#b00" }}>
            Permission to contact {new URL(preset.baseUrl).host} was denied.
          </span>
        )}
      </div>
    </div>
  );
}
