import { useEffect, useState } from "react";
import { isSelectionToolbarEnabled, setSelectionToolbarEnabled } from "../shared/selectionToolbarSetting";

export default function GeneralSettingsSection() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    isSelectionToolbarEnabled().then(setEnabled);
  }, []);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    await setSelectionToolbarEnabled(next);
  };

  return (
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
  );
}
