import { Puzzle } from "lucide-react";
import { PROVIDER_PRESETS } from "@openextension/providers";
import GeneralSettingsSection from "./GeneralSettingsSection";
import ProviderKeyForm from "./ProviderKeyForm";
import PromptLibrarySection from "./PromptLibrarySection";

export default function App() {
  return (
    <div style={{ maxWidth: 560, margin: "48px auto", padding: "0 var(--space-4)" }}>
      <h1 style={{ fontSize: 20, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <Puzzle size={20} /> OpenExtension
      </h1>

      <GeneralSettingsSection />

      <h2 style={{ fontSize: 16 }}>Providers</h2>
      <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
        Keys are stored locally in your browser profile, unencrypted — similar to a saved
        browser password. Don't use this on a shared or untrusted profile. Each key is sent
        only directly to that provider's own API.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
        {PROVIDER_PRESETS.map((preset) => (
          <ProviderKeyForm key={preset.id} preset={preset} />
        ))}
      </div>

      <PromptLibrarySection />
    </div>
  );
}
