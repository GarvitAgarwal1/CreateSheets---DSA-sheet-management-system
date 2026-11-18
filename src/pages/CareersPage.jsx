import { useState } from "react";
import AppShell from "../components/AppShell";
import SeoMeta from "../components/SeoMeta";

const HIREBLIND_HTTPS_URL = "https://hireblind.in/";
const HIREBLIND_HTTP_URL = "http://hireblind.in/";
const HIREBLIND_REPO_URL = "https://github.com/esnasir/hireblind";

const roles = [
  {
    title: "SEO Intern",
    status: "Coming soon",
    description: "Own keyword research, on-page SEO, and content optimization for CreateSheets and HireBlind hiring visibility.",
  },
  {
    title: "SEO Intern (Next Cohort)",
    status: "Coming soon",
    description: "Upcoming internship slot for the next onboarding batch focused on analytics-led SEO execution.",
  },
  {
    title: "UI Tester",
    status: "Coming soon",
    description: "Quality-focused role for responsive UI checks, bug reporting, and final screening experience polish.",
  },
];

function SiteLaunchButton() {
  const [status, setStatus] = useState("");

  const openHireBlind = async () => {
    setStatus("Checking secure site...");

    if (typeof window === "undefined" || typeof fetch === "undefined") {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 2500);

    try {
      await fetch(HIREBLIND_HTTPS_URL, {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-store",
        signal: controller.signal,
      });
      window.location.href = HIREBLIND_HTTPS_URL;
    } catch {
      setStatus("Secure link is not ready yet. Opening the current HTTP site.");
      window.location.href = HIREBLIND_HTTP_URL;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  return (
    <div className="careers-link-stack">
      <button type="button" className="btn-base btn-primary" onClick={openHireBlind}>
        Visit HireBlind
      </button>
      <a className="btn-base btn-neutral" href={HIREBLIND_REPO_URL} target="_blank" rel="noreferrer">
        GitHub Reference
      </a>
      {status ? <p className="careers-link-status">{status}</p> : null}
    </div>
  );
}

function CareersPage() {
  return (
    <AppShell title={null}>
      <SeoMeta
        title="CreateSheets Hiring | Powered by HireBlind"
        description="See how CreateSheets uses HireBlind for fair, bias-aware hiring with anonymized resume screening and auditable shortlisting."
        path="/careers"
      />

      <div className="careers-page">
        <section className="careers-hero">
          <div className="careers-hero-copy">
            <p className="careers-eyebrow">CreateSheets Hiring Stack</p>
            <h1>Our fair hiring system is powered by HireBlind.</h1>
            <p>
              At CreateSheets, we use HireBlind to keep hiring transparent and merit-based. Candidate resumes are anonymized, scored, and shortlisted before identity reveal, so no one feels the process is unfair or biased.
            </p>
            <div className="careers-hero-actions">
              <SiteLaunchButton />
              <p className="careers-link-note">
                For more details about the tool itself, you can visit the website or GitHub. We are sharing it here only to be transparent about our hiring process, not to promote it.
              </p>
            </div>
          </div>

          <div className="careers-preview-card" aria-label="HireBlind screening preview">
            <div className="careers-preview-topbar">
              <span>anonymized_profile.json</span>
              <strong>Redacted</strong>
            </div>
            <div className="careers-redacted-row">
              <span />
              <span />
              <span />
            </div>
            <h2>Anonymized Experience Summary</h2>
            <p>
              Candidate has 5+ years of React & TypeScript engineering experience at a major [REDACTED COMPANY]. Designed scalable UI components, improving workflow efficiency by 30%.
            </p>
            <div className="careers-score-panel">
              <span>AI Score Assessment</span>
              <strong>89/100</strong>
              <small>Ranked #1 in current CreateSheets campaign</small>
            </div>
          </div>
        </section>

        <section className="careers-impact-band" aria-label="Hiring impact">
          <div>
            <p className="careers-eyebrow">Hiring Progress</p>
            <h2>With HireBlind, we have analyzed 200+ resumes and shortlisted 20+ applicants for interviews.</h2>
          </div>
          <div className="careers-impact-metrics">
            <span><strong>200+</strong> resumes analyzed</span>
            <span><strong>20+</strong> interview shortlists</span>
          </div>
        </section>

        <section className="careers-section" id="roles">
          <div className="careers-section-heading">
            <p className="careers-eyebrow">Upcoming Careers</p>
            <h2>What we are hiring for at CreateSheets</h2>
            <p>Current openings and upcoming roles for the next hiring cycle powered by HireBlind.</p>
          </div>
          <div className="careers-role-grid">
            {roles.map((role) => (
              <article key={role.title} className="careers-role-card">
                <span className={role.status === "Hiring" ? "is-hiring" : "is-soon"}>{role.status}</span>
                <h3>{role.title}</h3>
                <p>{role.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="careers-final-cta">
          <p className="careers-eyebrow">Credit to HireBlind</p>
          <h2>HireBlind helps us run fair, defensible hiring at CreateSheets.</h2>
          <p>We use it to reduce bias, keep shortlisting transparent, and maintain trust with every applicant.</p>
          <SiteLaunchButton />
        </section>
      </div>
    </AppShell>
  );
}

export default CareersPage;
