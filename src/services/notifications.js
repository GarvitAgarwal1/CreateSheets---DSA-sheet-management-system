const VAPID_PUBLIC_KEY = "";
const NOTIFICATION_PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const NOTIFICATION_PROMPT_COOLDOWN_KEY = "notifications.permission.prompt.cooldownUntil";

const readPromptCooldownUntil = () => {
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_PROMPT_COOLDOWN_KEY);
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
};

const writePromptCooldownUntil = (timestamp) => {
  try {
    if (!timestamp) {
      window.localStorage.removeItem(NOTIFICATION_PROMPT_COOLDOWN_KEY);
      return;
    }
    window.localStorage.setItem(NOTIFICATION_PROMPT_COOLDOWN_KEY, String(timestamp));
  } catch {
    // localStorage may be unavailable in private contexts; fail silently.
  }
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
};

export const getNotificationPermissionState = () => {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
};

export const getNotificationPromptCooldownUntil = () => readPromptCooldownUntil();

export const shouldShowNotificationPrompt = () => {
  if (getNotificationPermissionState() !== "default") return false;
  return Date.now() >= readPromptCooldownUntil();
};

export const deferNotificationPromptFor24Hours = () => {
  const next = Date.now() + NOTIFICATION_PROMPT_COOLDOWN_MS;
  writePromptCooldownUntil(next);
  return next;
};

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    writePromptCooldownUntil(0);
    return permission;
  }
  deferNotificationPromptFor24Hours();
  return permission;
};

export const showDueNowBrowserNotification = async (notification) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const title = notification.type === "alarm" ? `Reminder: ${notification.title}` : `Time to revise: ${notification.title}`;
  const revision = notification.revisionNumber || notification?.metadata?.revisionNumber || "";
  const sheetTitle = notification.sheetTitle || notification?.metadata?.sheetTitle || "your sheet";
  const body = notification.type === "alarm"
    ? (notification.message || "Your reminder is due now.")
    : `Revision ${revision} for ${sheetTitle} is due now.`;

  if (navigator.serviceWorker?.controller) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.showNotification(title, {
        body,
        tag: `revision-${notification.id}`,
        data: { link: notification.link },
      });
      return;
    }
  }

  const browserNotification = new Notification(title, { body, tag: `revision-${notification.id}` });
  browserNotification.onclick = () => {
    window.focus();
    if (notification.link) window.location.assign(notification.link);
  };
};

export const subscribeToPushIfPossible = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  if (!VAPID_PUBLIC_KEY) return null;

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing.toJSON();

  const created = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  return created.toJSON();
};
