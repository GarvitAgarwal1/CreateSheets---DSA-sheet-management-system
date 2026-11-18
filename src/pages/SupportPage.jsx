import { useEffect, useMemo, useRef, useState } from "react";
import { AtSign, CheckCircle2, LifeBuoy, LockKeyhole, MessageSquareText, Sparkles } from "lucide-react";
import { submitFeedback } from "../api/feedbackApi";
import AppShell from "../components/AppShell";
import SeoMeta from "../components/SeoMeta";
import SurfaceCard from "../components/ui/SurfaceCard";
import { navigateTo, ROUTES } from "../services/routes";
import { useAuthStore } from "../store/authStore";

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_MESSAGE_LENGTH = 1200;
const SUPPORT_EMAIL = "hr.create.sheets@gmail.com";

const featureBlocks = [
  {
    title: "Structured preparation",
    description: "Build sheets around topics, subtopics, and question checkpoints instead of scattered notes.",
  },
  {
    title: "Progress with context",
    description: "See what is solved, partially attempted, failed, or still untouched across every sheet.",
  },
  {
    title: "Public sharing, private control",
    description: "Publish useful sheets for others while keeping private progress and drafts protected.",
  },
];

const supportLanes = [
  {
    icon: LifeBuoy,
    title: "Product support",
    description: "Account, sheet visibility, public profile, sharing, and workflow help.",
  },
  {
    icon: MessageSquareText,
    title: "Feedback",
    description: "Send improvement ideas with screenshots directly from your signed-in account.",
  },
  {
    icon: LockKeyhole,
    title: "Privacy-first handling",
    description: "Private sheets stay private; feedback only includes your account details when you submit it.",
  },
];

const routeCopy = {
  about: {
    title: "About & Support | Create Sheets",
    description: "Learn about Create Sheets, contact the team, and send product feedback from one support hub.",
    path: "/about",
  },
  contact: {
    title: "Contact & Support | Create Sheets",
    description: "Contact the Create Sheets team for support, product questions, and feedback.",
    path: "/contact",
  },
  feedback: {
    title: "Feedback & Support | Create Sheets",
    description: "Send Create Sheets feedback with screenshots from your signed-in account.",
    path: "/feedback",
  },
};

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function SupportBadge({ icon, title, description }) {
  const IconComponent = icon;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary-muted)] text-[var(--accent-primary)]">
        <IconComponent size={20} strokeWidth={1.9} aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="meta-text mt-1 text-sm">{description}</p>
    </div>
  );
}

function FeedbackForm() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const fileInputRef = useRef(null);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const imagePreviews = useMemo(() => {
    if (typeof URL === "undefined") return [];
    return images.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      size: formatFileSize(file.size),
      url: URL.createObjectURL(file),
    }));
  }, [images]);

  useEffect(() => () => {
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [imagePreviews]);

  const handleImagesChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validImages = [];
    let nextError = "";

    for (const file of selectedFiles) {
      if (!file.type.startsWith("image/")) {
        nextError = "Only image files can be attached.";
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        nextError = `Each image must be ${formatFileSize(MAX_IMAGE_SIZE_BYTES)} or smaller.`;
        continue;
      }
      validImages.push(file);
    }

    if (validImages.length > MAX_IMAGE_COUNT) {
      nextError = `You can attach up to ${MAX_IMAGE_COUNT} images.`;
    }

    const nextImages = validImages.slice(0, MAX_IMAGE_COUNT);
    const totalSize = nextImages.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_IMAGE_SIZE_BYTES) {
      nextError = `Attached images must be ${formatFileSize(MAX_TOTAL_IMAGE_SIZE_BYTES)} or smaller in total.`;
      setImages([]);
    } else {
      setImages(nextImages);
    }
    setStatus("");
    setError(nextError);
  };

  const removeImage = (imageId) => {
    setImages((currentImages) =>
      currentImages.filter((file) => `${file.name}-${file.size}-${file.lastModified}` !== imageId)
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser?.token) {
      setError("Please sign in before sending feedback.");
      return;
    }

    const normalizedTopic = topic.trim();
    const normalizedMessage = message.trim();
    if (!normalizedTopic) {
      setError("Topic is required.");
      return;
    }
    if (!normalizedMessage && images.length === 0) {
      setError("Add a message or at least one image.");
      return;
    }

    const payload = new FormData();
    payload.append("topic", normalizedTopic);
    payload.append("message", normalizedMessage);
    images.forEach((image) => payload.append("images", image));

    setSubmitting(true);
    setError("");
    setStatus("");

    try {
      const response = await submitFeedback(currentUser.token, payload);
      setStatus(response?.message || "Feedback sent.");
      setTopic("");
      setMessage("");
      setImages([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (submitError) {
      setError(submitError?.message || "Unable to send feedback right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SurfaceCard elevated title="Send feedback" description="Share bugs, polish requests, or workflow ideas with screenshots.">
      <form className="stack-form" onSubmit={handleSubmit} encType="multipart/form-data">
        {!currentUser?.token ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Sign in to attach account context</p>
            <p className="meta-text mt-1 text-sm">
              You can email support anytime, but in-app feedback needs login so we can connect it to your account safely.
            </p>
            <button type="button" className="btn-base btn-primary mt-3" onClick={() => navigateTo(ROUTES.LOGIN)}>
              Sign in
            </button>
          </div>
        ) : null}

        <label>
          <span className="stack-form-label">Topic</span>
          <input
            className="field-base"
            value={topic}
            maxLength={100}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Profile page, import flow, reminders..."
            disabled={submitting}
          />
        </label>

        <label>
          <span className="stack-form-label">Content</span>
          <textarea
            className="field-base min-h-[150px] resize-y"
            value={message}
            maxLength={MAX_MESSAGE_LENGTH}
            data-text-length-guard="off"
            onChange={(event) => setMessage(event.target.value)}
            placeholder="What happened? What should improve?"
            disabled={submitting}
          />
        </label>

        <div>
          <label className="stack-form-label" htmlFor="feedback-images">Images</label>
          <input
            ref={fileInputRef}
            id="feedback-images"
            type="file"
            accept="image/*"
            multiple
            className="field-base"
            onChange={handleImagesChange}
            disabled={submitting}
          />
        </div>

        {imagePreviews.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {imagePreviews.map((preview) => (
              <article key={preview.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-2">
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-[var(--surface-muted)]">
                  <img src={preview.url} alt={preview.name} className="h-full w-full object-cover" />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{preview.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{preview.size}</p>
                  </div>
                  <button
                    type="button"
                    className="btn-base btn-neutral btn-sm"
                    onClick={() => removeImage(preview.id)}
                    disabled={submitting}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-[color-mix(in_srgb,var(--accent-danger)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent-danger)_10%,var(--surface))] px-3 py-2 text-sm text-[var(--accent-danger)]">
            {error}
          </p>
        ) : null}
        {status ? (
          <p className="rounded-xl border border-[color-mix(in_srgb,var(--accent-success)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent-success)_10%,var(--surface))] px-3 py-2 text-sm text-[var(--accent-success)]">
            {status}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-tertiary)]">
            {message.length}/{MAX_MESSAGE_LENGTH} characters | {images.length}/{MAX_IMAGE_COUNT} images
          </p>
          <button className="btn-base btn-primary" type="submit" disabled={submitting || !currentUser?.token}>
            {submitting ? "Sending..." : "Send feedback"}
          </button>
        </div>
      </form>
    </SurfaceCard>
  );
}

function SupportPage({ entry = "about" }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const seo = routeCopy[entry] || routeCopy.about;
  const structuredData = useMemo(() => ([
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Create Sheets",
      url: "https://www.createsheets.com",
      email: SUPPORT_EMAIL,
      description: "Create Sheets helps learners create, share, and track DSA and interview preparation sheets.",
    },
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Create Sheets About & Support",
      url: `https://www.createsheets.com${seo.path}`,
      email: SUPPORT_EMAIL,
    },
  ]), [seo.path]);

  return (
    <AppShell title="About & Support" subtitle="Mission, contact, and product feedback in one workspace.">
      <SeoMeta
        title={seo.title}
        description={seo.description}
        path={seo.path}
        structuredData={structuredData}
      />

      <div className="space-y-5">
        <section className="surface-card surface-card-elevated overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
            <div className="p-5 sm:p-6">
              <p className="meta-text uppercase tracking-[0.18em]">Create Sheets</p>
              <h2 className="mt-3 max-w-3xl text-2xl font-bold leading-tight text-[var(--text-primary)] sm:text-3xl">
                A calm workspace for serious interview preparation.
              </h2>
              <p className="meta-text mt-3 max-w-2xl text-sm sm:text-base">
                Create Sheets helps learners turn DSA preparation into organized sheets, visible progress, and shareable public resources without mixing private progress into public work.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {featureBlocks.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</h3>
                    <p className="meta-text mt-1 text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-5 sm:p-6 lg:border-l lg:border-t-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-primary-muted)] text-[var(--accent-primary)]">
                  <Sparkles size={22} strokeWidth={1.9} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Built for consistent practice</p>
                  <p className="meta-text text-sm">Create, attempt, revise, publish, and improve.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {["Public sheets stay discoverable.", "Private sheets stay account-protected.", "Feedback reaches the team with useful context."].map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3">
                    <CheckCircle2 className="mt-0.5 flex-none text-[var(--accent-success)]" size={18} strokeWidth={2} aria-hidden="true" />
                    <p className="text-sm text-[var(--text-secondary)]">{item}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
          <div className="space-y-5">
            <SurfaceCard title="How we can help" description="Choose the channel that matches what you need.">
              <div className="grid gap-3">
                {supportLanes.map((item) => (
                  <SupportBadge key={item.title} {...item} />
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard elevated title="Contact the team" description="Use email for support, account questions, or anything that does not need screenshots.">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[var(--accent-primary-muted)] text-[var(--accent-primary)]">
                      <AtSign size={20} strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Support email</p>
                      <p className="break-all text-sm font-medium text-[var(--accent-primary)]">{SUPPORT_EMAIL}</p>
                    </div>
                  </div>
                  <a className="btn-base btn-neutral" href={`mailto:${SUPPORT_EMAIL}`}>
                    Email us
                  </a>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border-subtle)] p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Best for</p>
                  <p className="meta-text mt-1 text-sm">Login help, sheet sharing, profile questions, account support.</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-subtle)] p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Include</p>
                  <p className="meta-text mt-1 text-sm">Your username, page URL, and what you expected to happen.</p>
                </div>
              </div>
            </SurfaceCard>
          </div>

          <FeedbackForm />
        </div>

        {currentUser?.token ? (
          <SurfaceCard title="Your feedback identity" description="These account details are attached automatically when you submit feedback.">
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4">
                <dt className="text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Username</dt>
                <dd className="mt-1 font-medium text-[var(--text-primary)]">{currentUser?.username || "Signed-in user"}</dd>
              </div>
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4">
                <dt className="text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Email</dt>
                <dd className="mt-1 break-all font-medium text-[var(--text-primary)]">{currentUser?.email || "Account email"}</dd>
              </div>
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4">
                <dt className="text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Tag</dt>
                <dd className="mt-1 inline-flex rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--accent-primary)]">
                  Feedback
                </dd>
              </div>
            </dl>
          </SurfaceCard>
        ) : null}
      </div>
    </AppShell>
  );
}

export default SupportPage;
