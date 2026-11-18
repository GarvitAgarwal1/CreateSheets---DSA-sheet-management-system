import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../store/authStore";
import GoogleAuthButton from "../components/GoogleAuthButton";
import SeoMeta from "../components/SeoMeta";
import ThemeCinematicToggle from "../components/theme/ThemeCinematicToggle";

function LoginPage({ onLoginSuccess, onGoToSignUp }) {
  const login = useAuthStore((state) => state.login);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const sendForgotPasswordOtp = useAuthStore((state) => state.sendForgotPasswordOtp);
  const verifyForgotPasswordOtp = useAuthStore((state) => state.verifyForgotPasswordOtp);
  const resetForgotPassword = useAuthStore((state) => state.resetForgotPassword);
  const authError = useAuthStore((state) => state.authError);
  const authLoading = useAuthStore((state) => state.authLoading);
  const loginBlockedUntil = useAuthStore((state) => state.loginBlockedUntil);
  const otpInfoMessage = useAuthStore((state) => state.otpInfoMessage);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const lockSeconds = Math.max(0, Math.ceil((loginBlockedUntil - now) / 1000));
  const isLocked = lockSeconds > 0;

  useEffect(() => {
    if (!isLocked) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isLocked]);

  const lockMessage = useMemo(() => {
    if (!isLocked) return "";
    const minutes = Math.ceil(lockSeconds / 60);
    return `Login temporarily disabled due to multiple wrong attempts. Try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`;
  }, [isLocked, lockSeconds]);

  const submit = async (event) => {
    event.preventDefault();
    const success = await login(form);
    if (success) onLoginSuccess();
  };

  const handleGoogleLogin = async (idToken) => {
    const success = await loginWithGoogle(idToken);
    if (success) onLoginSuccess();
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) return;
    const success = await resetForgotPassword({ email: forgotEmail, otp: forgotOtp, newPassword });
    if (success) onLoginSuccess();
  };

  return (
    <div className="auth-page-layout">
      <SeoMeta title="Login | Create Sheets" description="Login to Create Sheets." path="/login" noIndex keywords={["login create sheets"]} />

      {/* Brand Panel */}
      <div className="auth-brand-panel">
        <h1 className="auth-brand-logo">Create Sheets</h1>
        <p className="auth-brand-tagline">Your structured path to<br />mastering DSA.</p>
        <ul className="auth-brand-features">
          <li className="auth-brand-feature">
            <span className="auth-brand-feature-check">✓</span>
            <span>Create custom DSA sheets with topics, subtopics, and questions</span>
          </li>
          <li className="auth-brand-feature">
            <span className="auth-brand-feature-check">✓</span>
            <span>Track your progress with attempt logs and confidence levels</span>
          </li>
          <li className="auth-brand-feature">
            <span className="auth-brand-feature-check">✓</span>
            <span>Share sheets publicly and collaborate with the community</span>
          </li>
          <li className="auth-brand-feature">
            <span className="auth-brand-feature-check">✓</span>
            <span>Set smart reminders and get spaced-repetition notifications</span>
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
          <h2 className="auth-form-title">Welcome back</h2>
          <p className="auth-form-subtitle">Sign in to your Create Sheets account</p>

          {!showForgot ? (
            <>
              <form className="stack-form" onSubmit={submit}>
                <label>
                  <span className="stack-form-label">Email or username</span>
                  <input type="text" required disabled={authLoading || isLocked} value={form.identifier} onChange={(e) => { clearAuthError(); setForm((c) => ({ ...c, identifier: e.target.value })); }} className="field-base w-full" placeholder="Enter your email or username" />
                </label>
                <label>
                  <span className="stack-form-label">Password</span>
                  <input type="password" required disabled={authLoading || isLocked} value={form.password} onChange={(e) => { clearAuthError(); setForm((c) => ({ ...c, password: e.target.value })); }} className="field-base w-full" placeholder="Enter your password" />
                </label>
                <button type="button" className="link-base text-left text-sm" onClick={() => { clearAuthError(); setShowForgot(true); }}>Forgot password?</button>
                {isLocked && <p className="text-sm text-[var(--accent-primary)]">{lockMessage}</p>}
                {authError && <p className="text-sm text-[var(--accent-danger)]">{authError}</p>}
                <button type="submit" disabled={authLoading || isLocked} className="btn-base btn-primary btn-lg w-full">{isLocked ? `Try again in ${lockSeconds}s` : authLoading ? "Signing in..." : "Sign in"}</button>
              </form>
              <div className="auth-divider">
                <span className="auth-divider-line" />
                <span className="auth-divider-text">or</span>
                <span className="auth-divider-line" />
              </div>
              <GoogleAuthButton disabled={authLoading || isLocked} text="signin_with" onCredential={handleGoogleLogin} onError={(message) => useAuthStore.setState({ authError: message })} />
            </>
          ) : (
            <div className="stack-form">
              <label><span className="stack-form-label">Email</span><input type="email" className="field-base w-full" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="Enter your email address" /></label>
              {!otpVerified && (
                <>
                  <button type="button" className="btn-base btn-secondary w-full" disabled={authLoading || !forgotEmail} onClick={() => sendForgotPasswordOtp(forgotEmail)}>Send OTP</button>
                  <label><span className="stack-form-label">OTP</span><input type="text" className="field-base w-full tracking-[0.4em] text-center" value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></label>
                  <button type="button" className="btn-base btn-primary w-full" disabled={authLoading || forgotOtp.length !== 6} onClick={async () => { const ok = await verifyForgotPasswordOtp({ email: forgotEmail, otp: forgotOtp }); if (ok) setOtpVerified(true); }}>Verify OTP</button>
                </>
              )}
              {otpVerified && (
                <>
                  <p className="text-xs text-[var(--text-tertiary)]">Choose one option:</p>
                  <button type="button" className="btn-base btn-secondary w-full" onClick={() => { setShowForgot(false); setOtpVerified(false); }}>Login without password reset</button>
                  <label><span className="stack-form-label">New password</span><input type="password" className="field-base w-full" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></label>
                  <label><span className="stack-form-label">Re-enter new password</span><input type="password" className="field-base w-full" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></label>
                  {confirmPassword && newPassword !== confirmPassword && <p className="text-sm text-[var(--accent-danger)]">Passwords do not match.</p>}
                  <button type="button" className="btn-base btn-primary w-full" disabled={authLoading || !newPassword || newPassword !== confirmPassword} onClick={handleResetPassword}>Reset password & login</button>
                </>
              )}
              {otpInfoMessage && <p className="text-sm text-[var(--accent-primary)]">{otpInfoMessage}</p>}
              {authError && <p className="text-sm text-[var(--accent-danger)]">{authError}</p>}
              <button type="button" className="link-base text-sm" onClick={() => { setShowForgot(false); setOtpVerified(false); }}>← Back to login</button>
            </div>
          )}
          <div className="mt-6 text-center">
            <button type="button" disabled={authLoading} onClick={onGoToSignUp} className="link-base text-sm">Don&apos;t have an account? <span className="font-semibold">Sign up</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
