import OAuthInfo from "@arcgis/core/identity/OAuthInfo.js";
import esriId from "@arcgis/core/identity/IdentityManager.js";
import Portal from "@arcgis/core/portal/Portal.js";
import type { IdentityManagerRegisterTokenProperties } from "@arcgis/core/identity/IdentityManagerBase.js";

const CLIENT_ID = import.meta.env.VITE_ARCGIS_CLIENT_ID;
const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || "https://www.arcgis.com";
const AUTH_STORAGE_KEY = "arcgis-auth-credential";
const POPUP_ATTEMPT_PREFIX = "arcgis-auth-popup";

if (!CLIENT_ID) {
  throw new Error("VITE_ARCGIS_CLIENT_ID is not set. Add it to your .env file.");
}

const SAFE_PORTAL_URL = (() => {
  try {
    const u = new URL(PORTAL_URL);
    if (u.protocol !== "https:") throw new Error("Portal URL must use HTTPS");
    const pathname = u.pathname.replace(/\/+$/, "");
    return `${u.origin}${pathname === "/" ? "" : pathname}`;
  } catch {
    return "https://www.arcgis.com";
  }
})();

const SHARING_URL = `${SAFE_PORTAL_URL}/sharing`;

interface AuthCompleteMessage {
  type: "arcgis-auth-complete";
  channelId: string;
  credential: IdentityManagerRegisterTokenProperties;
}

export const isEmbedded = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();

function getAuthChannelName(channelId: string): string {
  return `arcgis-auth-${channelId}`;
}

function getPopupAttemptKey(channelId: string): string {
  return `${POPUP_ATTEMPT_PREFIX}:${channelId}`;
}

function createChannelId(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Only register OAuthInfo when NOT in an iframe.
// Iframes can’t redirect to arcgis.com (X-Frame-Options).
// Embedded auth is handled via a manual popup relay (see openAuthPopup).
if (!isEmbedded) {
  esriId.registerOAuthInfos([new OAuthInfo({
    appId: CLIENT_ID,
    portalUrl: SAFE_PORTAL_URL,
    popup: false,
  })]);
}

export interface AuthUser {
  canEdit: boolean;
  fullName: string;
  username: string;
  thumbnailUrl: string | null;
  portalUrl: string;
}

async function loadUser(): Promise<AuthUser> {
  const portal = new Portal({ url: SAFE_PORTAL_URL });
  await portal.load();
  return {
    fullName: portal.user?.fullName?.trim() || portal.user?.username || "User",
    username: portal.user?.username ?? "unknown",
    thumbnailUrl: portal.user?.thumbnailUrl ?? null,
    portalUrl: SAFE_PORTAL_URL,
    canEdit: ["org_admin", "org_publisher"].includes(portal.user?.role ?? ""),
  };
}

function getRegisteredCredential(): IdentityManagerRegisterTokenProperties | null {
  const credential = esriId.findCredential(SHARING_URL);
  if (!credential?.server || !credential.token) {
    return null;
  }

  return {
    server: credential.server,
    token: credential.token,
    expires: credential.expires ?? undefined,
    userId: credential.userId || undefined,
    ssl: credential.ssl,
  };
}

function readStoredCredential(): IdentityManagerRegisterTokenProperties | null {
  try {
    const stored = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const credential = parsed as Record<string, unknown>;
    if (typeof credential.server !== "string" || typeof credential.token !== "string") {
      return null;
    }

    return {
      server: credential.server,
      token: credential.token,
      expires: typeof credential.expires === "number" ? credential.expires : undefined,
      userId: typeof credential.userId === "string" ? credential.userId : undefined,
      ssl: typeof credential.ssl === "boolean" ? credential.ssl : undefined,
    };
  } catch {
    return null;
  }
}

function registerCredential(credential: IdentityManagerRegisterTokenProperties): void {
  esriId.registerToken(credential);
}

function persistCredential(credential: IdentityManagerRegisterTokenProperties): void {
  try {
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(credential));
  } catch {
    // Ignore storage failures and continue with the in-memory credential.
  }
}

function clearStoredCredential(): void {
  try {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

function restoreStoredCredential(): void {
  const storedCredential = readStoredCredential();
  if (!storedCredential) {
    return;
  }

  registerCredential(storedCredential);
}

function isAuthCompleteMessage(data: unknown): data is AuthCompleteMessage {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const message = data as { type?: unknown; channelId?: unknown; credential?: unknown };
  if (message.type !== "arcgis-auth-complete") {
    return false;
  }

  if (typeof message.channelId !== "string") {
    return false;
  }

  if (typeof message.credential !== "object" || message.credential === null) {
    return false;
  }

  const credential = message.credential as Record<string, unknown>;
  return typeof credential.server === "string" && typeof credential.token === "string";
}

restoreStoredCredential();

/** Standalone redirect flow: check session or redirect to OAuth. */
export async function setupAuth(): Promise<AuthUser> {
  try {
    await esriId.checkSignInStatus(SHARING_URL);
  } catch {
    await esriId.getCredential(SHARING_URL);
  }
  return loadUser();
}

/** Silently check for existing credentials without triggering any UI. */
export async function tryExistingSession(): Promise<AuthUser | null> {
  try {
    await esriId.checkSignInStatus(SHARING_URL);
    return await loadUser();
  } catch {
    clearStoredCredential();
    return null;
  }
}

export async function completePopupAuth(): Promise<void> {
  const searchParams = new URLSearchParams(window.location.search);
  const channelId = searchParams.get("channelId");

  if (!channelId) {
    throw new Error("Missing popup auth channel.");
  }

  const popupAttemptKey = getPopupAttemptKey(channelId);
  const popupHasStarted = window.sessionStorage.getItem(popupAttemptKey) === "1";

  if (!popupHasStarted) {
    window.sessionStorage.setItem(popupAttemptKey, "1");
    await setupAuth();
  } else {
    await esriId.checkSignInStatus(SHARING_URL);
  }

  const credential = getRegisteredCredential();
  if (!credential) {
    throw new Error("ArcGIS credential was not available after sign-in.");
  }

  persistCredential(credential);

  const message: AuthCompleteMessage = {
    type: "arcgis-auth-complete",
    channelId,
    credential,
  };

  const channel = new BroadcastChannel(getAuthChannelName(channelId));
  channel.postMessage(message);
  channel.close();

  if (window.opener) {
    window.opener.postMessage(message, window.location.origin);
  }

  window.sessionStorage.removeItem(popupAttemptKey);

  window.close();
}

/**
 * Embedded popup relay: opens a top-level popup that performs a standard
 * redirect OAuth flow, then relays the credential back via BroadcastChannel.
 * This bypasses the SDK’s built-in popup mechanism entirely.
 */
export function openAuthPopup(): Promise<AuthUser> {
  return new Promise((resolve, reject) => {
    const channelId = createChannelId();
    const popup = window.open(
      `${window.location.origin}/?auth=popup&channelId=${encodeURIComponent(channelId)}`,
      `arcgis-auth-${channelId}`,
      "width=600,height=700"
    );
    if (!popup) {
      reject(new Error("Popup blocked. Please allow popups for this site."));
      return;
    }

    let settled = false;

    function onCredential(data: unknown) {
      if (settled || !isAuthCompleteMessage(data)) return;
      if (data.channelId !== channelId) return;
      settled = true;
      cleanup();
      registerCredential(data.credential);
      persistCredential(data.credential);
      loadUser().then(resolve).catch(reject);
    }

    // BroadcastChannel — works even if window.opener is lost after cross-origin redirect
    const channel = new BroadcastChannel(getAuthChannelName(channelId));
    channel.onmessage = (e: MessageEvent) => onCredential(e.data);

    // Also listen via postMessage as fallback
    const onMsg = (e: MessageEvent) => {
      if (e.origin === window.location.origin) onCredential(e.data);
    };
    window.addEventListener("message", onMsg);

    // Detect if popup is closed without completing
    const timer = setInterval(() => {
      if (popup.closed && !settled) {
        settled = true;
        cleanup();
        reject(new Error("Sign-in window was closed."));
      }
    }, 500);

    function cleanup() {
      channel.close();
      window.removeEventListener("message", onMsg);
      clearInterval(timer);
    }
  });
}

export function signOut(): void {
  esriId.destroyCredentials();
  clearStoredCredential();
  window.location.reload();
}
