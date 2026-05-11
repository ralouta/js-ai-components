import { useState, useEffect, useCallback } from "react";
import esriId from "@arcgis/core/identity/IdentityManager.js";
import esriRequest from "@arcgis/core/request.js";
import type { AppConfig, ColorKey } from "../types/settings.js";
import {
  DEFAULT_APP_TITLE,
  DEFAULT_CHAT_DESCRIPTION,
  DEFAULT_CHAT_HEADING,
  DEFAULT_COLORS,
  DEFAULT_PROMPTS,
  DEFAULT_LOGO_URL,
  applyColor,
} from "../constants/settings.js";

const STORAGE_KEY = "app-settings";
const PORTAL_URL = (import.meta.env.VITE_PORTAL_URL as string) || "https://www.arcgis.com";
const CONFIG_ITEM_ID = (import.meta.env.VITE_CONFIG_ITEM_ID as string) || "";
const ENV_MAP_ITEM_ID = (import.meta.env.VITE_MAP_ITEM_ID as string) || "";

const INITIAL_CONFIG: AppConfig = {
  appTitle: DEFAULT_APP_TITLE,
  mapItemId: ENV_MAP_ITEM_ID,
  chatHeading: DEFAULT_CHAT_HEADING,
  chatDescription: DEFAULT_CHAT_DESCRIPTION,
  colors: DEFAULT_COLORS,
  fontFamily: "",
  suggestedPrompts: DEFAULT_PROMPTS,
  logoUrl: DEFAULT_LOGO_URL,
};

function mergeWithInitial(partial: Partial<AppConfig>): AppConfig {
  const parsedMapItemId =
    typeof partial.mapItemId === "string" ? partial.mapItemId.trim() : "";
  return {
    ...INITIAL_CONFIG,
    ...partial,
    // Treat empty stored map IDs from older versions as "unset" and fallback to default.
    mapItemId: parsedMapItemId || INITIAL_CONFIG.mapItemId,
    // Only spread known color keys — guards against stale keys from old localStorage entries
    colors: (Object.keys(INITIAL_CONFIG.colors) as ColorKey[]).reduce<AppConfig["colors"]>(
      (acc, k) => ({ ...acc, [k]: partial.colors?.[k] ?? INITIAL_CONFIG.colors[k] }),
      { ...INITIAL_CONFIG.colors }
    ),
    suggestedPrompts: Array.isArray(partial.suggestedPrompts)
      ? partial.suggestedPrompts
      : INITIAL_CONFIG.suggestedPrompts,
  };
}

function loadLocalConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_CONFIG;
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    // Merge with INITIAL_CONFIG so new fields added later get their defaults
    return mergeWithInitial(parsed);
  } catch {
    return INITIAL_CONFIG;
  }
}

function saveLocalConfig(config: AppConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Local persistence is best-effort.
  }
}

async function loadRemoteConfig(): Promise<AppConfig | null> {
  if (!CONFIG_ITEM_ID) return null;
  try {
    // Public item — no token needed for read
    const response = await esriRequest(
      `${PORTAL_URL}/sharing/rest/content/items/${encodeURIComponent(CONFIG_ITEM_ID)}/data`,
      { query: { f: "json" }, responseType: "json" }
    );
    if (!response.data || typeof response.data !== "object") return null;
    const data = response.data as Record<string, unknown>;
    if (data.error) {
      console.warn("[config] remote load error:", data.error);
      return null;
    }
    return mergeWithInitial(data as Partial<AppConfig>);
  } catch (err) {
    console.warn("[config] loadRemoteConfig failed:", err);
    return null;
  }
}

async function saveRemoteConfig(config: AppConfig): Promise<void> {
  if (!CONFIG_ITEM_ID) {
    console.warn("[config] CONFIG_ITEM_ID is empty, skipping remote save");
    return;
  }
  try {
    const credential =
      esriId.findCredential(`${PORTAL_URL}/sharing`) ??
      (await esriId.getCredential(`${PORTAL_URL}/sharing`));

    // Fetch item metadata to get owner
    const itemResponse = await esriRequest(
      `${PORTAL_URL}/sharing/rest/content/items/${encodeURIComponent(CONFIG_ITEM_ID)}`,
      { query: { f: "json", token: credential.token }, responseType: "json" }
    );
    const owner =
      typeof (itemResponse.data as { owner?: unknown }).owner === "string"
        ? (itemResponse.data as { owner: string }).owner
        : credential.userId;
    if (!owner) return;

    const url = `${PORTAL_URL}/sharing/rest/content/users/${encodeURIComponent(owner)}/items/${encodeURIComponent(CONFIG_ITEM_ID)}/update`;

    const formData = new FormData();
    formData.append("f", "json");
    if (!credential.token) {
      throw new Error("No authentication token available");
    }
    formData.append("token", credential.token);
    formData.append("text", JSON.stringify(config));

    // Use native fetch instead of esriRequest so FormData is sent correctly
    const response = await fetch(url, { method: "POST", body: formData });
    if (!response.ok) {
      throw new Error(`ArcGIS update returned HTTP ${response.status}`);
    }
    const result = (await response.json()) as Record<string, unknown>;

    if (result.error || result.success === false) {
      console.error("[config] saveRemoteConfig ArcGIS error:", result.error ?? result);
      throw new Error(JSON.stringify(result.error ?? result));
    }
  } catch (err) {
    console.error("[config] saveRemoteConfig failed:", err);
    throw err;
  }
}

interface UseSettingsResult {
  config: AppConfig;
  draft: AppConfig;
  modalOpen: boolean;
  openSettings: () => void;
  applySettings: () => void;
  cancelSettings: () => void;
  setDraftMapId: (v: string) => void;
  setDraftTitle: (v: string) => void;
  setDraftHeading: (v: string) => void;
  setDraftDescription: (v: string) => void;
  setDraftColor: (key: ColorKey, value: string) => void;
  setDraftFontFamily: (v: string) => void;
  setDraftLogoUrl: (v: string) => void;
  addPrompt: () => void;
  updatePrompt: (index: number, value: string) => void;
  removePrompt: (index: number) => void;
  needsMapId: boolean;
  confirmMapId: (id: string) => void;
  remoteSaveError: string | null;
}

export function useSettings(): UseSettingsResult {
  const [config, setConfig] = useState<AppConfig>(loadLocalConfig);
  const [draft, setDraft] = useState<AppConfig>(loadLocalConfig);
  const [hydrated, setHydrated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  // true on first visit — no mapItemId stored yet
  const [needsMapId, setNeedsMapId] = useState(() => !loadLocalConfig().mapItemId);
  const [remoteSaveError, setRemoteSaveError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const remote = await loadRemoteConfig();
        if (remote) {
          setConfig(remote);
          setDraft(remote);
          saveLocalConfig(remote);
        }
      } catch (err) {
        console.warn("[config] hydration failed:", err);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Apply colors to CSS custom properties whenever config.colors changes
  useEffect(() => {
    (Object.keys(config.colors) as ColorKey[]).forEach((key) =>
      applyColor(key, config.colors[key])
    );
  }, [config.colors]);

  // Apply font family
  useEffect(() => {
    document.documentElement.style.fontFamily = config.fontFamily;
    document.body.style.fontFamily = config.fontFamily;
  }, [config.fontFamily]);

  // Persist config on every change. Remote save is best-effort.
  useEffect(() => {
    saveLocalConfig(config);
    if (!hydrated) return;
    void saveRemoteConfig(config);
  }, [config, hydrated]);

  const confirmMapId = useCallback((id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    setConfig((prev) => ({ ...prev, mapItemId: trimmed }));
    setDraft((prev) => ({ ...prev, mapItemId: trimmed }));
    setNeedsMapId(false);
  }, []);

    const openSettings = useCallback(() => {
    setDraft({
      ...config,
      colors: { ...config.colors },
      suggestedPrompts: [...config.suggestedPrompts],
    });
    setModalOpen(true);
  }, [config]);

  const applySettings = useCallback(() => {
    const next: AppConfig = {
      ...draft,
      colors: { ...draft.colors },
      suggestedPrompts: draft.suggestedPrompts.filter((p) => p.trim() !== ""),
    };
    // Persist immediately on Save so a fast browser refresh cannot race the
    // post-render effect that also persists config changes.
    saveLocalConfig(next);
    setRemoteSaveError(null);
    saveRemoteConfig(next).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      setRemoteSaveError(msg);
    });
    if (draft.mapItemId !== config.mapItemId) {
      window.location.reload();
      return;
    }
    setConfig(next);
    setModalOpen(false);
  }, [draft, config.mapItemId]);

  const cancelSettings = useCallback(() => setModalOpen(false), []);

  const setDraftMapId = useCallback(
    (v: string) => setDraft((prev) => ({ ...prev, mapItemId: v })),
    []
  );
  const setDraftTitle = useCallback(
    (v: string) => setDraft((prev) => ({ ...prev, appTitle: v })),
    []
  );
  const setDraftHeading = useCallback(
    (v: string) => setDraft((prev) => ({ ...prev, chatHeading: v })),
    []
  );
  const setDraftDescription = useCallback(
    (v: string) => setDraft((prev) => ({ ...prev, chatDescription: v })),
    []
  );
  const setDraftColor = useCallback((key: ColorKey, value: string) => {
    setDraft((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  }, []);
  const setDraftFontFamily = useCallback(
    (v: string) => setDraft((prev) => ({ ...prev, fontFamily: v })),
    []
  );
  const setDraftLogoUrl = useCallback(
    (v: string) => setDraft((prev) => ({ ...prev, logoUrl: v })),
    []
  );
  const addPrompt = useCallback(
    () => setDraft((prev) => ({ ...prev, suggestedPrompts: [...prev.suggestedPrompts, ""] })),
    []
  );
  const updatePrompt = useCallback((index: number, value: string) => {
    setDraft((prev) => ({
      ...prev,
      suggestedPrompts: prev.suggestedPrompts.map((p, i) => (i === index ? value : p)),
    }));
  }, []);
  const removePrompt = useCallback((index: number) => {
    setDraft((prev) => ({
      ...prev,
      suggestedPrompts: prev.suggestedPrompts.filter((_, i) => i !== index),
    }));
  }, []);

  return {
    config,
    draft,
    modalOpen,
    openSettings,
    applySettings,
    cancelSettings,
    setDraftMapId,
    setDraftTitle,
    setDraftHeading,
    setDraftDescription,
    setDraftColor,
    setDraftFontFamily,
    setDraftLogoUrl,
    addPrompt,
    updatePrompt,
    removePrompt,
    needsMapId,
    confirmMapId,
    remoteSaveError,
  };
}
