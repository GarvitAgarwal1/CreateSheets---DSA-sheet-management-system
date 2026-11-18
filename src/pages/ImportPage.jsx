import { useState } from "react";
import { parseSheetJsonText } from "../services/importValidation";
import { useSheetStore } from "../store/sheetStore";
import { useAuthStore } from "../store/authStore";
import { navigateTo, ROUTES } from "../services/routes";
import AppShell from "../components/AppShell";

function ImportPage({ theme, onThemeChange, onBack }) {
  const setFullSheet = useSheetStore((state) => state.setFullSheet);
  const duplicateSheet = useSheetStore((state) => state.duplicateSheet);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [message, setMessage] = useState("");

  const onFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      setErrors(["Only JSON files are allowed for import."]);
      setWarnings([]);
      setMessage("");
      return;
    }
    const content = await file.text();
    const validation = parseSheetJsonText(content);
    if (!validation.valid) {
      setErrors(validation.errors);
      setWarnings(validation.warnings || []);
      setMessage("");
      return;
    }

    const normalizedSheet = validation.normalized;
    const importWarnings = validation.warnings || [];

    if (currentUser?.token) {
      const created = await duplicateSheet(currentUser.token, normalizedSheet, normalizedSheet.name);
      if (!created) {
        setErrors(["Could not import sheet because the workspace safety limit was reached."]);
        setWarnings(importWarnings);
        setMessage("");
        return;
      }

      setErrors([]);
      setWarnings(importWarnings);
      setMessage(
        validation.recoveredSyntax
          ? "Sheet imported and saved to My Sheets. We auto-fixed minor JSON syntax issues."
          : "Sheet imported and saved to My Sheets."
      );
      navigateTo(`${ROUTES.APP}/${created.id}`);
      return;
    }

    await setFullSheet(normalizedSheet);
    setErrors([]);
    setWarnings(importWarnings);
    setMessage(
      validation.recoveredSyntax
        ? "Sheet imported successfully. We auto-fixed minor JSON syntax issues."
        : "Sheet imported successfully."
    );
  };

  return (
    <AppShell title="Import Sheet JSON" subtitle="Upload validated JSON data into the current sheet" theme={theme} onThemeChange={onThemeChange}>
      <div className="panel p-6">
        <p className="mb-3 text-sm text-[var(--text-secondary)]">Import works with JSON only. Required fields: <code>name</code>, <code>topics</code> array. For non-empty content, each topic needs <code>title</code>, each subtopic needs <code>title</code>, and each question needs <code>text</code>.</p>
        <a href="/sample-import-sheet.json" download className="btn-base btn-neutral mb-4 inline-block">Download sample JSON file</a>
        <input type="file" accept="application/json,.json" onChange={onFileChange} className="field-base mb-4 block w-full" />
        {message && <p className="mb-3 text-[var(--accent-success)]">{message}</p>}
        {errors.length > 0 && <ul className="mb-4 list-disc space-y-1 rounded-md border border-[color-mix(in_srgb,var(--accent-danger)_55%,transparent)] bg-[color-mix(in_srgb,var(--accent-danger)_11%,var(--surface-elevated))] p-4 pl-8 text-sm text-[var(--accent-danger)]">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
        {warnings.length > 0 && <ul className="mb-4 list-disc space-y-1 rounded-md border border-[color-mix(in_srgb,var(--accent-warning)_55%,transparent)] bg-[color-mix(in_srgb,var(--accent-warning)_11%,var(--surface-elevated))] p-4 pl-8 text-sm text-[var(--accent-warning)]">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
        <button type="button" onClick={onBack} className="btn-base btn-neutral">Back to App</button>
      </div>
    </AppShell>
  );
}

export default ImportPage;
