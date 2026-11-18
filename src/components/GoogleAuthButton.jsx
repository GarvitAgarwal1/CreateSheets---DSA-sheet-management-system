import { useEffect, useMemo, useRef, useState } from "react";
import { getGoogleClientConfig } from "../api/authApi";
import { googleAuthAllowedOrigins, googleAuthClientId } from "../config/envConfig";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_UNAVAILABLE_MESSAGE = "Google Sign-In is currently unavailable.";

const getCurrentOrigin = () => (typeof window === "undefined" ? "" : window.location.origin);
const isLocalOrigin = (origin) => {
  try {
    const parsed = new URL(origin);
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  } catch {
    return false;
  }
};

function Spinner() {
  return <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />;
}

function GoogleGlyph() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 2.9 14.6 2 12 2 6.9 2 2.8 6.5 2.8 12s4.1 10 9.2 10c5.3 0 8.8-3.8 8.8-9.1 0-.6-.1-1.1-.2-1.6H12z" />
      <path fill="#34A853" d="M3.7 7.3l3.2 2.4C7.7 8 9.7 6.6 12 6.6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.8 14.6 2.9 12 2.9c-3.6 0-6.7 2.1-8.3 5.4z" opacity=".01" />
      <path fill="#FBBC05" d="M12 22c2.4 0 4.5-.8 6-2.3l-2.9-2.4c-.8.6-1.9 1-3.1 1-2.6 0-4.8-1.7-5.6-4.1l-3 2.4C5 20 8.3 22 12 22z" />
      <path fill="#4285F4" d="M20.8 12.9c0-.6-.1-1.1-.2-1.6H12v3.9h5.5c-.3 1.2-1 2.2-2.1 2.9l2.9 2.4c1.7-1.6 2.5-4 2.5-7.6z" />
    </svg>
  );
}

function GoogleAuthButton({ disabled = false, onCredential, onError, text = "continue_with" }) {
  const hostRef = useRef(null);
  const didReportErrorRef = useRef(false);

  const [scriptReady, setScriptReady] = useState(false);
  const [googleAuthClientIdState, setGoogleAuthClientIdState] = useState(() => googleAuthClientId);
  const [configLookupComplete, setConfigLookupComplete] = useState(false);

  const currentOrigin = getCurrentOrigin();
  const originIsAllowed = useMemo(() => {
    if (!currentOrigin) return true;
    if (googleAuthAllowedOrigins.length > 0) {
      return googleAuthAllowedOrigins.includes(currentOrigin);
    }
    return !isLocalOrigin(currentOrigin);
  }, [currentOrigin]);
  const isGoogleAuthConfigured = useMemo(() => Boolean(googleAuthClientIdState) && originIsAllowed, [googleAuthClientIdState, originIsAllowed]);

  useEffect(() => {
    let active = true;
    getGoogleClientConfig()
      .then((config) => {
        if (!active) return;

        if (config?.googleAuthEnabled && typeof config?.clientId === "string" && config.clientId.trim().length > 0) {
          const backendClientId = config.clientId.trim();
          setGoogleAuthClientIdState(backendClientId);
          return;
        }

        if (!googleAuthClientId) {
          onError?.("Google Sign-In is not configured. Missing Google client ID.");
        }
      })
      .catch(() => {
        if (!active) return;
        if (!googleAuthClientId && !didReportErrorRef.current) {
          didReportErrorRef.current = true;
          onError?.(GOOGLE_UNAVAILABLE_MESSAGE);
        }
      })
      .finally(() => {
        if (active) setConfigLookupComplete(true);
      });

    return () => {
      active = false;
    };
  }, [onError]);

  useEffect(() => {
    if (!isGoogleAuthConfigured) return;

    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    const handleReady = () => setScriptReady(true);

    if (existing) {
      if (window.google?.accounts?.id) {
        handleReady();
      } else {
        existing.addEventListener("load", handleReady, { once: true });
      }
      return () => existing.removeEventListener("load", handleReady);
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = handleReady;
    script.onerror = () => {
      if (didReportErrorRef.current) return;
      didReportErrorRef.current = true;
      onError?.(GOOGLE_UNAVAILABLE_MESSAGE);
    };

    document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [isGoogleAuthConfigured, onError]);

  useEffect(() => {
    if (!scriptReady || !hostRef.current || !window.google?.accounts?.id || !isGoogleAuthConfigured) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleAuthClientIdState,
        callback: (response) => {
          if (!response?.credential) {
            onError?.("Google did not return a valid token. Please try again.");
            return;
          }
          onCredential?.(response.credential);
        },
      });

      hostRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(hostRef.current, {
        type: "standard",
        theme: "filled_black",
        shape: "pill",
        text,
        size: "large",
        width: 360,
        logo_alignment: "left",
      });
    } catch {
      if (didReportErrorRef.current) return;
      didReportErrorRef.current = true;
      onError?.(GOOGLE_UNAVAILABLE_MESSAGE);
    }
  }, [googleAuthClientIdState, scriptReady, isGoogleAuthConfigured, onCredential, onError, text]);

  if (!originIsAllowed) {
    return (
      <div className="auth-local-oauth-note" role="status">
        Google sign-in is paused on this local URL. Use email/password here, or add <code>{currentOrigin}</code> as an Authorized JavaScript origin in Google Cloud Console.
      </div>
    );
  }

  if (!isGoogleAuthConfigured && configLookupComplete) {
    return <p className="text-xs text-[var(--accent-danger)]">{GOOGLE_UNAVAILABLE_MESSAGE}</p>;
  }

  return (
    <div className="mx-auto w-full max-w-[360px]">
      {!scriptReady && (
        <div
          className={`flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-5 text-sm font-medium text-white backdrop-blur-md transition-all duration-200 ease-out ${
            disabled ? "cursor-not-allowed opacity-70" : "hover:bg-white/10"
          }`}
          aria-hidden="true"
        >
          {disabled ? <Spinner /> : <GoogleGlyph />}
          <span className="leading-none">Continue with Google</span>
        </div>
      )}
      <div
        className={`overflow-hidden rounded-2xl ${disabled ? "pointer-events-none opacity-60" : ""} ${scriptReady ? "" : "sr-only"}`}
        ref={hostRef}
        aria-label="Continue with Google"
      />
    </div>
  );
}

export default GoogleAuthButton;
