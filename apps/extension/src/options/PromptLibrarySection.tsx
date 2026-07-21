import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { listCustomPrompts, saveCustomPrompt, deleteCustomPrompt } from "../storage/promptRepository";
import type { CustomPrompt } from "../storage/schema";
import { extractTemplateVariables, isValidCommandSlug } from "../shared/promptTemplate";
import { BUILT_IN_COMMANDS } from "../shared/builtInCommands";

const emptyForm = { id: null as string | null, label: "", command: "", template: "" };

export default function PromptLibrarySection() {
  const [prompts, setPrompts] = useState<CustomPrompt[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => listCustomPrompts().then(setPrompts);

  useEffect(() => {
    refresh();
  }, []);

  const variables = extractTemplateVariables(form.template);
  const fillable = variables.filter((name) => name !== "page" && name !== "selection");

  const handleEdit = (prompt: CustomPrompt) => {
    setForm({ id: prompt.id, label: prompt.label, command: prompt.command, template: prompt.template });
    setError(null);
  };

  const handleDelete = async (id: string) => {
    await deleteCustomPrompt(id);
    if (form.id === id) setForm(emptyForm);
    refresh();
  };

  const handleSave = async () => {
    const label = form.label.trim();
    const command = form.command.trim().toLowerCase();
    const template = form.template.trim();

    if (!label || !command || !template) {
      setError("Label, command, and prompt text are all required.");
      return;
    }
    if (!isValidCommandSlug(command)) {
      setError("Command can only use lowercase letters, numbers, and hyphens.");
      return;
    }
    if (BUILT_IN_COMMANDS.has(command)) {
      setError(`"/${command}" is already a built-in command — pick another.`);
      return;
    }
    const collision = prompts.find((p) => p.command === command && p.id !== form.id);
    if (collision) {
      setError(`"/${command}" is already used by "${collision.label}".`);
      return;
    }

    await saveCustomPrompt({ id: form.id ?? crypto.randomUUID(), label, command, template });
    setForm(emptyForm);
    setError(null);
    refresh();
  };

  return (
    <div style={{ marginTop: "var(--space-5)" }}>
      <h2 style={{ fontSize: 16 }}>Prompt Library</h2>
      <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
        Your own slash commands. Use <code>{"{{page}}"}</code> or <code>{"{{selection}}"}</code> to pull in page
        content or the current selection automatically — any other <code>{"{{name}}"}</code> is asked for in a small
        form before the prompt runs.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className="panel"
            style={{
              padding: "var(--space-2) var(--space-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-2)",
            }}
          >
            <div>
              <strong style={{ fontSize: 13 }}>{prompt.label}</strong>{" "}
              <span className="text-muted" style={{ fontSize: 12 }}>
                /{prompt.command}
              </span>
            </div>
            <div style={{ display: "flex", gap: "var(--space-1)" }}>
              <button className="btn-ghost" title="Edit" onClick={() => handleEdit(prompt)}>
                <Pencil className="icon" size={14} />
              </button>
              <button className="btn-ghost" title="Delete" onClick={() => handleDelete(prompt.id)}>
                <Trash2 className="icon" size={14} />
              </button>
            </div>
          </div>
        ))}
        {prompts.length === 0 && (
          <p className="text-muted" style={{ fontSize: 13 }}>
            No custom prompts yet.
          </p>
        )}
      </div>

      <div className="panel" style={{ padding: "var(--space-3) var(--space-4)", marginTop: "var(--space-3)" }}>
        <strong style={{ fontSize: 13 }}>{form.id ? "Edit prompt" : "New prompt"}</strong>

        <input
          className="input"
          placeholder="Label, e.g. Translate with tone"
          value={form.label}
          onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
          style={{ marginTop: "var(--space-2)" }}
        />
        <input
          className="input"
          placeholder="command (no leading slash), e.g. tone-translate"
          value={form.command}
          onChange={(event) => setForm((prev) => ({ ...prev, command: event.target.value }))}
          style={{ marginTop: "var(--space-2)" }}
        />
        <textarea
          className="input"
          placeholder={"Translate {{selection}} into {{language}}, using a {{tone}} tone."}
          value={form.template}
          onChange={(event) => setForm((prev) => ({ ...prev, template: event.target.value }))}
          rows={4}
          style={{ marginTop: "var(--space-2)", resize: "vertical" }}
        />

        {variables.length > 0 && (
          <p className="text-muted" style={{ fontSize: 12, marginTop: "var(--space-1)" }}>
            Variables: {variables.join(", ")}
            {fillable.length < variables.length ? " (page/selection fill automatically)" : ""}
          </p>
        )}

        <div style={{ marginTop: "var(--space-2)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <button className="btn btn-primary" onClick={handleSave}>
            {form.id ? "Save changes" : "Add prompt"}
          </button>
          {form.id && (
            <button className="btn-ghost" onClick={() => setForm(emptyForm)}>
              Cancel
            </button>
          )}
          {error && <span className="text-danger">{error}</span>}
        </div>
      </div>
    </div>
  );
}
