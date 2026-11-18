import { useEffect, useMemo, useState } from "react";
import { fetchProfile } from "../api/profileApi";
import AppShell from "../components/AppShell";
import { getUserProfileRoute, navigateTo, ROUTES } from "../services/routes";
import { useAuthStore } from "../store/authStore";

const EMPTY_FORM = {
  name: "",
  email: "",
  username: "",
  headline: "",
  location: "",
  bio: "",
  institution: "",
  company: "",
  websiteUrl: "",
  githubUrl: "",
  linkedinUrl: "",
  resumeUrl: "",
  skills: "",
  projects: "",
  achievements: "",
  experience: "",
  education: "",
};

const fromProfile = (profile = {}) => ({
  ...EMPTY_FORM,
  name: profile.name || "",
  email: profile.email || "",
  username: profile.username || "",
  headline: profile.headline || "",
  location: profile.location || "",
  bio: profile.bio || "",
  institution: profile.institution || "",
  company: profile.company || "",
  websiteUrl: profile.websiteUrl || "",
  githubUrl: profile.githubUrl || "",
  linkedinUrl: profile.linkedinUrl || "",
  resumeUrl: profile.resumeUrl || "",
  skills: profile.skills || "",
  projects: profile.projects || "",
  achievements: profile.achievements || "",
  experience: profile.experience || "",
  education: profile.education || "",
});

function Field({ label, help, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
      {children}
      {help ? <span className="block text-xs leading-5 text-[var(--text-tertiary)]">{help}</span> : null}
    </label>
  );
}

function TextInput({ value, onChange, disabled = false, placeholder = "", type = "text" }) {
  return (
    <input
      className="field-base w-full disabled:cursor-not-allowed disabled:opacity-60"
      value={value}
      disabled={disabled}
      type={type}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  );
}

function TextArea({ value, onChange, placeholder = "", rows = 4, maxLength }) {
  return (
    <>
      <textarea
        className="field-base w-full resize-y"
        value={value}
        rows={rows}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {maxLength ? (
        <span className="block text-right text-[11px] text-[var(--text-tertiary)]">
          {value.length}/{maxLength}
        </span>
      ) : null}
    </>
  );
}

function EditProfilePage({ theme, onThemeChange }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const authError = useAuthStore((state) => state.authError);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);

  const [form, setForm] = useState(() => fromProfile(currentUser || {}));
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    clearAuthError?.();
  }, [clearAuthError]);

  useEffect(() => {
    const load = async () => {
      if (!currentUser?.token) return;
      setIsLoadingProfile(true);
      try {
        const profile = await fetchProfile(currentUser.token);
        setForm(fromProfile({ ...currentUser, ...profile }));
      } finally {
        setIsLoadingProfile(false);
      }
    };
    load();
  }, [currentUser]);

  const usernameChangesRemaining = Number(currentUser?.usernameChangesRemaining ?? 7);
  const emailChangesRemaining = Number(currentUser?.emailChangesRemaining ?? 7);
  const isUsernameLocked = usernameChangesRemaining <= 0;
  const isEmailLocked = emailChangesRemaining <= 0;
  const previewUrl = useMemo(() => `${window.location.origin}${getUserProfileRoute(form.username || currentUser?.username)}`, [currentUser?.username, form.username]);

  const setField = (field, value) => {
    setSaveMessage("");
    setForm((current) => ({
      ...current,
      [field]: field === "username" ? value.toLowerCase() : value,
    }));
  };

  const handleSave = async () => {
    if (!currentUser?.token) {
      navigateTo(ROUTES.LOGIN);
      return;
    }

    setIsSaving(true);
    setSaveMessage("");
    try {
      const isSaved = await updateProfile(form);
      if (isSaved) {
        setSaveMessage("Profile saved. Public portfolio is ready.");
        navigateTo(getUserProfileRoute(form.username || currentUser?.username));
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell title="Edit Profile" subtitle="Build your public developer portfolio" theme={theme} onThemeChange={onThemeChange}>
      <div className="mx-auto grid max-w-6xl gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="surface-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
              <div>
                <p className="caption-text text-xs">Identity</p>
                <h2 className="section-title mt-1">Profile Basics</h2>
                <p className="meta-text mt-1 text-sm">These fields appear on your public profile and portfolio header.</p>
              </div>
              {isLoadingProfile ? <span className="profile-sheet-badge profile-sheet-badge--muted">Loading</span> : null}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Name">
                <TextInput value={form.name} onChange={(value) => setField("name", value)} placeholder="Your display name" />
              </Field>
              <Field label="Email" help={`Email changes left: ${Math.max(0, emailChangesRemaining)} / 7`}>
                <TextInput value={form.email} disabled={isEmailLocked} onChange={(value) => setField("email", value)} placeholder="you@example.com" type="email" />
              </Field>
              <Field label="Username" help={`Username changes left: ${Math.max(0, usernameChangesRemaining)} / 7`}>
                <TextInput value={form.username} disabled={isUsernameLocked} onChange={(value) => setField("username", value)} placeholder="unique-handle" />
              </Field>
              <Field label="Location">
                <TextInput value={form.location} onChange={(value) => setField("location", value)} placeholder="City, Country" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Headline" help="Short role or positioning line shown near your name.">
                  <TextInput value={form.headline} onChange={(value) => setField("headline", value)} placeholder="Full-stack developer and DSA mentor" />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Bio">
                  <TextArea value={form.bio} onChange={(value) => setField("bio", value)} maxLength={700} placeholder="Write a concise public bio." rows={4} />
                </Field>
              </div>
            </div>
          </section>

          <section className="surface-card p-5">
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <p className="caption-text text-xs">Portfolio</p>
              <h2 className="section-title mt-1">Projects, Skills, And Milestones</h2>
              <p className="meta-text mt-1 text-sm">Use one item per line. Projects support: title | description | link.</p>
            </div>

            <div className="mt-5 grid gap-4">
              <Field label="Skills" help="Separate skills with commas or new lines.">
                <TextArea value={form.skills} onChange={(value) => setField("skills", value)} maxLength={600} placeholder="React, Spring Boot, MongoDB, Graph Algorithms" rows={3} />
              </Field>
              <Field label="Featured Projects" help="Format: Project name | what it does | https://link">
                <TextArea value={form.projects} onChange={(value) => setField("projects", value)} maxLength={1600} placeholder={"DSA Sheet Builder | Custom progress tracker for interview prep | https://example.com\nCoding Stats Dashboard | Aggregates platform stats | https://github.com/me/project"} rows={5} />
              </Field>
              <Field label="Achievements">
                <TextArea value={form.achievements} onChange={(value) => setField("achievements", value)} maxLength={1200} placeholder={"Solved 500+ DSA questions\nBuilt 10 public sheets\nTop 10% in weekly contest"} rows={4} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Experience">
                  <TextArea value={form.experience} onChange={(value) => setField("experience", value)} maxLength={1400} placeholder="Role - Company - impact" rows={4} />
                </Field>
                <Field label="Education">
                  <TextArea value={form.education} onChange={(value) => setField("education", value)} maxLength={1000} placeholder="Degree - Institution - year" rows={4} />
                </Field>
              </div>
            </div>
          </section>

          <section className="surface-card p-5">
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <p className="caption-text text-xs">Links</p>
              <h2 className="section-title mt-1">Public Links</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Institution">
                <TextInput value={form.institution} onChange={(value) => setField("institution", value)} placeholder="College or university" />
              </Field>
              <Field label="Company">
                <TextInput value={form.company} onChange={(value) => setField("company", value)} placeholder="Company or organization" />
              </Field>
              <Field label="Website">
                <TextInput value={form.websiteUrl} onChange={(value) => setField("websiteUrl", value)} placeholder="https://your-site.dev" />
              </Field>
              <Field label="GitHub">
                <TextInput value={form.githubUrl} onChange={(value) => setField("githubUrl", value)} placeholder="https://github.com/username" />
              </Field>
              <Field label="LinkedIn">
                <TextInput value={form.linkedinUrl} onChange={(value) => setField("linkedinUrl", value)} placeholder="https://linkedin.com/in/username" />
              </Field>
              <Field label="Resume">
                <TextInput value={form.resumeUrl} onChange={(value) => setField("resumeUrl", value)} placeholder="https://resume-link.pdf" />
              </Field>
            </div>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
          <section className="surface-card surface-card-elevated p-5">
            <p className="caption-text text-xs">Preview</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--accent-primary)_18%,var(--surface-elevated))] text-lg font-semibold">
                {(form.name || form.username || "U").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--text-primary)]">{form.name || "Your name"}</p>
                <p className="truncate text-sm text-[var(--text-secondary)]">@{form.username || "username"}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{form.headline || form.bio || "Your portfolio summary will appear here."}</p>
            <p className="mt-3 break-all rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 text-xs text-[var(--text-tertiary)]">{previewUrl}</p>
          </section>

          {authError ? <div className="alert-banner alert-banner--danger">{authError}</div> : null}
          {saveMessage ? <div className="alert-banner alert-banner--success">{saveMessage}</div> : null}

          <div className="surface-card p-4">
            <div className="grid gap-2">
              <button className="btn-base btn-success w-full" type="button" disabled={isSaving} onClick={handleSave}>
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
              <button className="btn-base btn-neutral w-full" type="button" onClick={() => navigateTo(getUserProfileRoute(currentUser?.username))}>
                Cancel
              </button>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

export default EditProfilePage;
