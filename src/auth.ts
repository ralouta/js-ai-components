import OAuthInfo from "@arcgis/core/identity/OAuthInfo.js";
import esriId from "@arcgis/core/identity/IdentityManager.js";
import Portal from "@arcgis/core/portal/Portal.js";

const CLIENT_ID = import.meta.env.VITE_ARCGIS_CLIENT_ID as string;
const PORTAL_URL = (import.meta.env.VITE_PORTAL_URL as string) || "https://www.arcgis.com";

export interface AuthUser {
  fullName: string;
  username: string;
  thumbnailUrl: string | null;
  portalUrl: string;
}

export async function setupAuth(): Promise<AuthUser> {
  const info = new OAuthInfo({
    appId: CLIENT_ID,
    portalUrl: PORTAL_URL,
    popup: false,
  });

  esriId.registerOAuthInfos([info]);

  try {
    await esriId.checkSignInStatus(`${PORTAL_URL}/sharing`);
  } catch {
    await esriId.getCredential(`${PORTAL_URL}/sharing`);
  }

  const portal = new Portal({ url: PORTAL_URL });
  await portal.load();

  return {
    fullName: portal.user?.fullName?.trim() || portal.user?.username || "User",
    username: portal.user?.username ?? "unknown",
    thumbnailUrl: portal.user?.thumbnailUrl ?? null,
    portalUrl: PORTAL_URL,
  };
}

export function signOut(): void {
  esriId.destroyCredentials();
  window.location.href = `${PORTAL_URL}/home/pages/Account/manage_accounts.html#client_id=arcgisonline&signout=true`;
}

export function switchAccount(): void {
  esriId.destroyCredentials();
  // Reload triggers setupAuth → checkSignInStatus fails → getCredential
  // prompts a fresh OAuth sign-in so the user can choose a different account.
  window.location.reload();
}
