import { useEffect, useState } from "react";

function SheetMetadataDrawer({
  open,
  initialTitle,
  initialDescription,
  initialLogoUrl,
  initialSheetUrl,
  isPublic,
  isArchived,
  shareProgress,
  onClose,
  onSave,
  onToggleVisibility,
  onToggleArchive,
  onToggleShareProgress,
  onDelete,
  onCopy
}) {
  const [title, setTitle] = useState(initialTitle || "");
  const [description, setDescription] = useState(initialDescription || "");
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl || "");
  const [sheetUrl, setSheetUrl] = useState(initialSheetUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(initialTitle || "");
    setDescription(initialDescription || "");
    setLogoUrl(initialLogoUrl || "");
    setSheetUrl(initialSheetUrl || "");
    setSaveError("");
    setIsSaving(false);
  }, [initialDescription, initialLogoUrl, initialSheetUrl, initialTitle, open]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && open && !isSaving) onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSaving, onClose, open]);

  if (!open) return null;

  const isValidOptionalHttpUrl = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return true;

    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSaving) return;
    const trimmedLogoUrl = logoUrl.trim();
    const trimmedSheetUrl = sheetUrl.trim();

    if (!isValidOptionalHttpUrl(trimmedLogoUrl)) {
      setSaveError("Sheet Logo URL must be a valid http or https URL.");
      return;
    }
    if (!isValidOptionalHttpUrl(trimmedSheetUrl)) {
      setSaveError("Sheet Reference URL must be a valid http or https URL.");
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      await onSave?.({ title: trimmedTitle, description: description.trim(), logoUrl: trimmedLogoUrl, sheetUrl: trimmedSheetUrl });
    } catch (error) {
      setSaveError(error?.message || "Unable to save sheet details. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="drawer-overlay" onClick={() => { if (!isSaving) onClose?.(); }} />
      <aside className="drawer-panel">
        <header className="drawer-header">
          <h2 className="drawer-title">Edit sheet details</h2>
          <button type="button" className="btn-base btn-ghost btn-sm px-2 py-1" onClick={onClose} disabled={isSaving}>
            ✕
          </button>
        </header>

        <div className="drawer-body">
          <div className="space-y-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">Title</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="field-base w-full text-sm"
                placeholder="Enter sheet title"
                maxLength={120}
                disabled={isSaving}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={6}
                className="field-base w-full text-sm"
                placeholder="Enter sheet description"
                maxLength={1000}
                disabled={isSaving}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">Sheet Logo URL</span>
              <input
                type="url"
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                className="field-base w-full text-sm"
                placeholder="https://example.com/logo.png (leave blank for default favicon)"
                maxLength={2048}
                disabled={isSaving}
              />
              <span className="meta-text block text-xs">Paste a direct image link. This will be shown as the sheet's circular logo.</span>
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">Sheet Reference URL</span>
              <input
                type="url"
                value={sheetUrl}
                onChange={(event) => setSheetUrl(event.target.value)}
                className="field-base w-full text-sm"
                placeholder="https://example.com/my-sheet-link"
                maxLength={2048}
                disabled={isSaving}
              />
              <span className="meta-text block text-xs">An optional external link to associate with this sheet (e.g. a Notion page, Google Doc, etc.)</span>
            </label>

            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={onToggleVisibility}
                  className="h-4 w-4 rounded border-[var(--border-subtle)] bg-[var(--surface-elevated)]"
                  disabled={isSaving}
                />
                <span className="text-sm font-medium text-[var(--text-primary)]">Public Sheet</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareProgress}
                  onChange={onToggleShareProgress}
                  className="h-4 w-4 rounded border-[var(--border-subtle)] bg-[var(--surface-elevated)]"
                  disabled={isSaving}
                />
                <span className="text-sm font-medium text-[var(--text-primary)]">Share Progress</span>
              </label>
            </div>

            <section className="drawer-section mt-4 pt-4 border-t border-[var(--border-subtle)]">
              <h3 className="drawer-section-title">Sheet Actions</h3>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-base btn-neutral px-3 py-1.5 text-sm" onClick={onToggleArchive} disabled={isSaving}>
                  {isArchived ? "Restore Sheet" : "Archive Sheet"}
                </button>
                <button type="button" className="btn-base btn-neutral px-3 py-1.5 text-sm" onClick={onCopy} disabled={isSaving}>
                  Duplicate Copy
                </button>
                <button type="button" className="btn-base btn-danger px-3 py-1.5 text-sm" onClick={onDelete} disabled={isSaving}>
                  Delete Sheet
                </button>
              </div>
            </section>

            {saveError ? <p className="text-sm text-[var(--accent-danger)]">{saveError}</p> : null}
          </div>
        </div>

        <footer className="drawer-footer">
          <button type="button" className="btn-base btn-neutral px-4 py-2" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button type="button" className="btn-base btn-primary px-4 py-2" onClick={handleSave} disabled={!title.trim() || isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </button>
        </footer>
      </aside>
    </>
  );
}

export default SheetMetadataDrawer;
