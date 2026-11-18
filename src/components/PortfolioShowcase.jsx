const splitLines = (value) => `${value || ""}`
  .split(/\r?\n/)
  .map((item) => item.trim())
  .filter(Boolean);

const splitTags = (value) => `${value || ""}`
  .split(/[\n,]/)
  .map((item) => item.trim())
  .filter(Boolean);

const normalizeUrl = (value) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const parseProject = (line) => {
  const [title, description, rawUrl] = line.split("|").map((part) => part?.trim() || "");
  return {
    title: title || line,
    description: description || "",
    url: normalizeUrl(rawUrl),
  };
};

function EmptyPortfolio({ isOwner }) {
  return (
    <div className="surface-card surface-card-elevated p-5 text-sm text-[var(--text-secondary)]">
      {isOwner
        ? "Add projects, skills, achievements, education, and experience from Edit Profile to turn this page into a public portfolio."
        : "This creator has not published portfolio sections yet."}
    </div>
  );
}

function MiniSection({ title, children, className = "" }) {
  return (
    <section className={`surface-card surface-card-elevated p-4 ${className}`.trim()}>
      <p className="caption-text text-xs">{title}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function PortfolioShowcase({ profile, isOwner = false }) {
  const skills = splitTags(profile?.skills);
  const achievements = splitLines(profile?.achievements);
  const projects = splitLines(profile?.projects).map(parseProject);
  const experience = splitLines(profile?.experience);
  const education = splitLines(profile?.education);
  const hasPortfolio = Boolean(
    profile?.bio
    || profile?.headline
    || skills.length
    || achievements.length
    || projects.length
    || experience.length
    || education.length
  );

  if (!hasPortfolio) return <EmptyPortfolio isOwner={isOwner} />;

  return (
    <div className="space-y-4">
      <section className="surface-card surface-card-elevated overflow-hidden p-0">
        <div className="border-b border-[var(--border-subtle)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-primary)_14%,var(--surface-elevated)),var(--surface))] p-5">
          <p className="caption-text text-xs">Portfolio Snapshot</p>
          <h2 className="section-title mt-2 text-xl">
            {profile?.headline || profile?.bio || "Developer portfolio"}
          </h2>
          {profile?.bio ? (
            <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{profile.bio}</p>
          ) : null}
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-3">
          {[
            { label: "Projects", value: projects.length },
            { label: "Skills", value: skills.length },
            { label: "Milestones", value: achievements.length },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
              <p className="text-2xl font-semibold text-[var(--text-primary)]">{item.value}</p>
              <p className="caption-text mt-1 text-xs">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {skills.length ? (
        <MiniSection title="Skills">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className="rounded-full border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--accent-info)_10%,transparent)] px-3 py-1 text-xs font-medium text-[var(--text-primary)]">
                {skill}
              </span>
            ))}
          </div>
        </MiniSection>
      ) : null}

      {projects.length ? (
        <MiniSection title="Featured Projects">
          <div className="grid gap-3 lg:grid-cols-2">
            {projects.map((project, index) => (
              <article key={`${project.title}-${index}`} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="card-title text-base">{project.title}</h3>
                  {project.url ? (
                    <a className="btn-base btn-neutral px-2 py-1 text-xs" href={project.url} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  ) : null}
                </div>
                {project.description ? <p className="meta-text mt-2 text-sm">{project.description}</p> : null}
              </article>
            ))}
          </div>
        </MiniSection>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {experience.length ? (
          <MiniSection title="Experience">
            <div className="space-y-3">
              {experience.map((item, index) => (
                <p key={`${item}-${index}`} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 text-sm text-[var(--text-secondary)]">
                  {item}
                </p>
              ))}
            </div>
          </MiniSection>
        ) : null}

        {education.length ? (
          <MiniSection title="Education">
            <div className="space-y-3">
              {education.map((item, index) => (
                <p key={`${item}-${index}`} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 text-sm text-[var(--text-secondary)]">
                  {item}
                </p>
              ))}
            </div>
          </MiniSection>
        ) : null}
      </div>

      {achievements.length ? (
        <MiniSection title="Achievements">
          <div className="grid gap-2 sm:grid-cols-2">
            {achievements.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 text-sm text-[var(--text-secondary)]">
                {item}
              </div>
            ))}
          </div>
        </MiniSection>
      ) : null}
    </div>
  );
}

export default PortfolioShowcase;
