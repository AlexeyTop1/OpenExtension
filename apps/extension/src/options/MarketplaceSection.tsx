import { useEffect, useState } from "react";
import { Check, Download } from "lucide-react";
import { getMarketplaceIndex, refreshMarketplaceIndex, fetchMarketplacePack } from "../shared/marketplaceStorage";
import type { MarketplacePackMeta } from "../shared/marketplace";
import { listCustomPrompts, saveCustomPrompt } from "../storage/promptRepository";
import { isValidCommandSlug } from "../shared/promptTemplate";
import { BUILT_IN_COMMANDS } from "../shared/builtInCommands";

type InstallStatus =
  | { kind: "idle" }
  | { kind: "installing" }
  | { kind: "done"; installed: number; skipped: number }
  | { kind: "error"; message: string };

export default function MarketplaceSection() {
  const [packs, setPacks] = useState<MarketplacePackMeta[]>([]);
  const [statusByPack, setStatusByPack] = useState<Record<string, InstallStatus>>({});

  useEffect(() => {
    getMarketplaceIndex().then(setPacks);
    // The background alarm refreshes this every 4h, but Options is opened
    // rarely enough that a fresh fetch on open is worth it too.
    refreshMarketplaceIndex().then(() => getMarketplaceIndex().then(setPacks));
  }, []);

  const install = async (pack: MarketplacePackMeta) => {
    setStatusByPack((prev) => ({ ...prev, [pack.id]: { kind: "installing" } }));
    const entries = await fetchMarketplacePack(pack.id);
    if (!entries) {
      setStatusByPack((prev) => ({
        ...prev,
        [pack.id]: { kind: "error", message: "Couldn't download this pack." },
      }));
      return;
    }

    const existing = await listCustomPrompts();
    const takenCommands = new Set<string>([...BUILT_IN_COMMANDS, ...existing.map((p) => p.command)]);

    let installed = 0;
    let skipped = 0;
    for (const entry of entries) {
      const command = entry.command.trim().toLowerCase();
      if (!isValidCommandSlug(command) || takenCommands.has(command)) {
        skipped += 1;
        continue;
      }
      await saveCustomPrompt({ id: crypto.randomUUID(), label: entry.label, command, template: entry.template });
      takenCommands.add(command);
      installed += 1;
    }

    setStatusByPack((prev) => ({ ...prev, [pack.id]: { kind: "done", installed, skipped } }));
  };

  return (
    <div style={{ marginTop: "var(--space-5)" }}>
      <h2 style={{ fontSize: 16 }}>Marketplace</h2>
      <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
        Community-shared prompt packs — installing adds their prompts to your Prompt Library above. Packs are plain
        JSON files in the OpenExtension repo; anyone can contribute one via a pull request.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
        {packs.map((pack) => {
          const status = statusByPack[pack.id] ?? { kind: "idle" as const };
          return (
            <div key={pack.id} className="panel" style={{ padding: "var(--space-3) var(--space-4)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "var(--space-2)",
                }}
              >
                <div>
                  <strong style={{ fontSize: 13 }}>{pack.name}</strong>
                  <p className="text-muted" style={{ fontSize: 12, margin: "var(--space-1) 0 0" }}>
                    {pack.description}
                  </p>
                  <p className="text-muted" style={{ fontSize: 11, margin: "var(--space-1) 0 0" }}>
                    by {pack.author}
                  </p>
                </div>
                <button
                  className="btn btn-icon"
                  onClick={() => install(pack)}
                  disabled={status.kind === "installing"}
                >
                  <Download className="icon" size={14} /> {status.kind === "installing" ? "Installing…" : "Install"}
                </button>
              </div>
              {status.kind === "done" && (
                <p className="text-muted" style={{ fontSize: 12, marginTop: "var(--space-1)" }}>
                  <Check className="icon" size={12} style={{ verticalAlign: "middle" }} /> Installed{" "}
                  {status.installed}
                  {status.skipped > 0 ? `, skipped ${status.skipped} (command already taken)` : ""}.
                </p>
              )}
              {status.kind === "error" && (
                <p className="text-danger" style={{ fontSize: 12, marginTop: "var(--space-1)" }}>
                  {status.message}
                </p>
              )}
            </div>
          );
        })}
        {packs.length === 0 && (
          <p className="text-muted" style={{ fontSize: 13 }}>
            No packs available yet.
          </p>
        )}
      </div>
    </div>
  );
}
