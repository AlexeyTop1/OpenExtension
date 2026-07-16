import { PROVIDER_PRESETS } from "@openextension/providers";
import ProviderKeyForm from "./ProviderKeyForm";

export default function App() {
  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 18 }}>OpenExtension — Providers</h1>
      <p style={{ fontSize: 12, color: "#666" }}>
        Keys are stored locally in your browser profile, unencrypted — similar to a
        saved browser password. Don't use this on a shared or untrusted profile. Each
        key is sent only directly to that provider's own API.
      </p>

      {PROVIDER_PRESETS.map((preset) => (
        <ProviderKeyForm key={preset.id} preset={preset} />
      ))}
    </div>
  );
}
