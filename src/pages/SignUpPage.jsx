import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/authStore";
import GoogleAuthButton from "../components/GoogleAuthButton";
import SeoMeta from "../components/SeoMeta";
import ThemeCinematicToggle from "../components/theme/ThemeCinematicToggle";

function SignUpPage({ onSignUpSuccess, onGoToLogin }) {
  const signUp = useAuthStore((state) => state.signUp);
  const resendOtp = useAuthStore((state) => state.resendOtp);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const authError = useAuthStore((state) => state.authError);
  const authLoading = useAuthStore((state) => state.authLoading);
  const pendingSignupEmail = useAuthStore((state) => state.pendingSignupEmail);
  const otpResendAvailableInSeconds = useAuthStore((state) => state.otpResendAvailableInSeconds);
  const otpInfoMessage = useAuthStore((state) => state.otpInfoMessage);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const cancelPendingSignup = useAuthStore((state) => state.cancelPendingSignup);

  const [form, setForm] = useState({ name: "", email: "", username: "", password: "" });
  const [otp, setOtp] = useState("");
  const [resendLeft, setResendLeft] = useState(0);
  const hasInjectedBackGuardRef = useRef(false);

  const isOtpStep = Boolean(pendingSignupEmail);

  useEffect(() => {
    setResendLeft(Math.max(0, Number(otpResendAvailableInSeconds || 0)));
  }, [otpResendAvailableInSeconds]);

  useEffect(() => {
    if (resendLeft <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendLeft]);

  useEffect(() => {
    if (!isOtpStep) {
      hasInjectedBackGuardRef.current = false;
      return undefined;
    }

    if (!hasInjectedBackGuardRef.current) {
      window.history.pushState({ signupOtpGuard: true }, "", window.location.href);
      hasInjectedBackGuardRef.current = true;
    }

    const handlePopState = () => {
      const confirmed = window.confirm("Leave OTP verification and go back to signup? Your current verification session will be cancelled and a new OTP will be sent when you sign up again.");
      if (!confirmed) {
        window.history.pushState({ signupOtpGuard: true }, "", window.location.href);
        return;
      }
      cancelPendingSignup();
      onGoToLogin();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [cancelPendingSignup, isOtpStep, onGoToLogin]);

  const handleGoToLogin = () => {
    if (!isOtpStep) {
      onGoToLogin();
      return;
    }

    const confirmed = window.confirm("Leave OTP verification and go back to signup? Your current verification session will be cancelled and a new OTP will be sent when you sign up again.");
    if (!confirmed) return;

    cancelPendingSignup();
    onGoToLogin();
  };

  const submitSignUp = async (event) => {
    event.preventDefault();
    const success = await signUp(form);
    if (success) {
      setOtp("");
    }
  };

  const submitOtp = async (event) => {
    event.preventDefault();
    const success = await verifyOtp({ email: pendingSignupEmail, otp });
    if (success) onSignUpSuccess();
  };

  const handleGoogleSignup = async (idToken) => {
    const success = await loginWithGoogle(idToken);
    if (success) onSignUpSuccess();
  };

  return (
    <div className="auth-page-layout">
      <SeoMeta
        title="Signup | Create DSA Sheets Online"
        description="Sign up on Create Sheets to build custom coding sheets, DSA practice trackers, and interview preparation lists."
        path="/signup"
        noIndex
        keywords={["signup create sheets", "create dsa sheet online"]}
      />

      {/* Brand Panel */}
      <div className="auth-brand-panel">
        <h1 className="auth-brand-logo">Create Sheets</h1>
        <p className="auth-brand-tagline">Build your own DSA<br />preparation system.</p>
        <ul className="auth-brand-features">
          <li className="auth-brand-feature">
            <span className="auth-brand-feature-check">✓</span>
            <span>Organize questions into topics and subtopics</span>
          </li>
          <li className="auth-brand-feature">
            <span className="auth-brand-feature-check">✓</span>
            <span>Log attempts with results, notes, and confidence levels</span>
          </li>
          <li className="auth-brand-feature">
            <span className="auth-brand-feature-check">✓</span>
            <span>Get learning insights and analytics included</span>
          </li>
          <li className="auth-brand-feature">
            <span className="auth-brand-feature-check">✓</span>
            <span>Free to start — no credit card required</span>
          </li>
        </ul>
      </div>

      {/* Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div className="flex items-center justify-between mb-6">
            <div className="auth-form-logo-mark">CS</div>
            <ThemeCinematicToggle />
          </div>
          <h2 className="auth-form-title">Create your account</h2>
          <p className="auth-form-subtitle">Start building your sheet workspace</p>

          {!isOtpStep ? (
            <>
              <form className="stack-form" onSubmit={submitSignUp}>
                <label>
                  <span className="stack-form-label">Full name</span>
                  <input type="text" required disabled={authLoading} value={form.name} placeholder="Enter your full name" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, name: event.target.value })); }} className="field-base w-full" />
                </label>
                <label>
                  <span className="stack-form-label">Email</span>
                  <input type="email" required disabled={authLoading} value={form.email} placeholder="Enter your email" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, email: event.target.value })); }} className="field-base w-full" />
                </label>
                <label>
                  <span className="stack-form-label">Username</span>
                  <input type="text" required minLength={3} maxLength={30} pattern="[a-zA-Z0-9_-]+" disabled={authLoading} value={form.username} placeholder="Choose a unique username" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, username: event.target.value })); }} className="field-base w-full" />
                </label>
                <label>
                  <span className="stack-form-label">Password</span>
                  <input type="password" required minLength={8} disabled={authLoading} value={form.password} placeholder="Min. 8 characters" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, password: event.target.value })); }} className="field-base w-full" />
                </label>
                {authError && <p className="text-sm text-[var(--accent-danger)]">{authError}</p>}
                <button type="submit" disabled={authLoading} className="btn-base btn-primary btn-lg w-full">{authLoading ? "Creating account..." : "Create account"}</button>
              </form>
              <div className="auth-divider">
                <span className="auth-divider-line" />
                <span className="auth-divider-text">or</span>
                <span className="auth-divider-line" />
              </div>
              <GoogleAuthButton disabled={authLoading} text="signup_with" onCredential={handleGoogleSignup} onError={(message) => useAuthStore.setState({ authError: message })} />
            </>
          ) : (
            <form className="stack-form" onSubmit={submitOtp}>
              <p className="text-sm text-[var(--text-secondary)]">Enter the 6-digit code sent to <span className="font-semibold text-[var(--text-primary)]">{pendingSignupEmail}</span>.</p>
              {otpInfoMessage && <p className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2 text-xs text-[var(--text-secondary)]">{otpInfoMessage}</p>}
              <label>
                <span className="stack-form-label">Verification code</span>
                <input type="text" required pattern="\d{6}" minLength={6} maxLength={6} value={otp} disabled={authLoading} onChange={(event) => { clearAuthError(); setOtp(event.target.value.replace(/\D/g, "").slice(0, 6)); }} className="field-base w-full tracking-[0.4em] text-center font-mono text-lg" placeholder="000000" />
              </label>
              {authError && <p className="text-sm text-[var(--accent-danger)]">{authError}</p>}
              <button type="submit" disabled={authLoading || otp.length !== 6} className="btn-base btn-primary btn-lg w-full">{authLoading ? "Verifying..." : "Verify & continue"}</button>
              <button type="button" disabled={authLoading || resendLeft > 0} className="btn-base btn-neutral w-full" onClick={() => resendOtp(pendingSignupEmail)}>
                {resendLeft > 0 ? `Resend OTP in ${resendLeft}s` : "Resend OTP"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button type="button" disabled={authLoading} onClick={handleGoToLogin} className="link-base text-sm">Already have an account? <span className="font-semibold">Sign in</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
