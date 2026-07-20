import { useEffect, useState } from "react";
import { isSelectionToolbarEnabled, setSelectionToolbarEnabled } from "../shared/selectionToolbarSetting";
import { getVoiceInputLanguage, setVoiceInputLanguage } from "../shared/voiceInputSetting";

type MicStatus = "idle" | "requesting" | "granted" | "denied";

export default function GeneralSettingsSection() {
  const [enabled, setEnabled] = useState(true);
  const [micStatus, setMicStatus] = useState<MicStatus>("idle");
  const [voiceLanguage, setVoiceLanguageState] = useState("");

  useEffect(() => {
    isSelectionToolbarEnabled().then(setEnabled);
    getVoiceInputLanguage().then(setVoiceLanguageState);
  }, []);

  const handleVoiceLanguageChange = async (value: string) => {
    setVoiceLanguageState(value);
    await setVoiceInputLanguage(value);
  };

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    await setSelectionToolbarEnabled(next);
  };

  const requestMicAccess = async () => {
    setMicStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicStatus("granted");
    } catch {
      setMicStatus("denied");
    }
  };

  return (
    <>
      <div className="panel" style={{ padding: "var(--space-3) var(--space-4)", marginBottom: "var(--space-4)" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontWeight: 600, fontSize: 14 }}>
          <input type="checkbox" checked={enabled} onChange={toggle} />
          Floating selection toolbar
        </label>
        <p className="text-muted" style={{ fontSize: 13, marginTop: "var(--space-1)", lineHeight: 1.5 }}>
          Shows a small toolbar (Explain, Translate, …) whenever you select text on a page. Turn this off if you'd
          rather trigger selection actions only from the right-click menu, which stays available either way. On by
          default.
        </p>
      </div>

      <div className="panel" style={{ padding: "var(--space-3) var(--space-4)", marginBottom: "var(--space-4)" }}>
        <strong style={{ fontSize: 14 }}>Voice input microphone access</strong>
        <p className="text-muted" style={{ fontSize: 13, marginTop: "var(--space-1)", lineHeight: 1.5 }}>
          The sidebar's mic button uses the browser's built-in speech recognition. Chrome's permission prompt
          doesn't render properly inside the narrow sidebar panel, so grant it here instead — this page and the
          sidebar share the same origin, so it carries over.
        </p>
        <div style={{ marginTop: "var(--space-2)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <button className="btn btn-primary" onClick={requestMicAccess} disabled={micStatus === "requesting"}>
            {micStatus === "requesting" ? "Requesting…" : "Enable microphone"}
          </button>
          {micStatus === "granted" && <span className="text-muted">Granted — voice input should work now.</span>}
          {micStatus === "denied" && (
            <span className="text-danger">
              Denied — check chrome://settings/content/microphone for this extension.
            </span>
          )}
        </div>

        <div style={{ marginTop: "var(--space-3)" }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Voice input language</label>
          <p className="text-muted" style={{ fontSize: 12, margin: "var(--space-1) 0" }}>
            Leave blank to auto-detect from Chrome's language settings (not always accurate) — or set a BCP-47 code
            directly, e.g. <code>es-ES</code> or <code>en-US</code>.
          </p>
          <input
            className="input"
            placeholder="auto"
            value={voiceLanguage}
            onChange={(event) => handleVoiceLanguageChange(event.target.value)}
            style={{ maxWidth: 160 }}
          />
        </div>
      </div>
    </>
  );
}
