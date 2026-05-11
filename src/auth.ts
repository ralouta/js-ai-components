import OAuthInfo from "@arcgis/core/identity/OAuthInfo.js";
import esriId from "@arcgis/core/identity/IdentityManager.js";
import Portal from "@arcgis/core/portal/Portal.js";

const CLIENT_ID = import.meta.env.VITE_ARCGIS_CLIENT_ID;
const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || "https://www.arcgis.com";

if (!CLIENT_ID) {
  throw new Error("VITE_ARCGIS_CLIENT_ID is not set. Add it to your .env file.");
}

// Validate PORTAL_URL is a safe https URL before using in redirects
const SAFE_PORTAL_URL = (() => {
  try {
    const u = new URL(PORTAL_URL);
    if (u.protocol !== "https:") throw new Error("Portal URL must use HTTPS");
    return u.origin;
  } catch {
    return "https://www.arcgis.com";
  }
})();

export interface AuthUser {
  canEdit: boolean;
  fullName: string;
  username: string;
  thumbnailUrl: string | null;
  portalUrl: string;
}

export async function setupAuth(): Promise<AuthUser> {
  const info = new OAuthInfo({
    appId: CLIENT_ID,
    portalUrl: SAFE_PORTAL_URL,
    popup: false,
  });

  esriId.registerOAuthInfos([info]);

  try {
    await esriId.checkSignInStatus(`${SAFE_PORTAL_URL}/sharing`);
  } catch {
    await esriId.getCredential(`${SAFE_PORTAL_URL}/sharing`);
  }

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

export function signOut(): void {
  esriId.destroyCredentials();
  window.location.href = `${SAFE_PORTAL_URL}/home/pages/Account/manage_accounts.html#client_id=arcgisonline&signout=true`;
}

export function switchAccount(): void {
  esriId.destroyCredentials();
  window.location.reload();
}
