import { useState, useEffect, useCallback } from "react";
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

const INITIAL_CONFIG: AppConfig = {
  appTitle: DEFAULT_APP_TITLE,
  mapItemId: "",
  chatHeading: DEFAULT_CHAT_HEADING,
  chatDescription: DEFAULT_CHAT_DESCRIPTION,
  colors: DEFAULT_COLORS,
  fontFamily: "",
  suggestedPrompts: DEFAULT_PROMPTS,
  logoUrl: DEFAULT_LOGO_URL,
};

function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_CONFIG;
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    // Merge with INITIAL_CONFIG so new fields added later get their defaults
    return {
      ...INITIAL_CONFIG,
      ...parsed,
      // Only spread known color keys — guards against stale keys from old localStorage entries
      colors: (Object.keys(INITIAL_CONFIG.colors) as ColorKey[]).reduce<AppConfig["colors"]>(
        (acc, k) => ({ ...acc, [k]: parsed.colors?.[k] ?? INITIAL_CONFIG.colors[k] }),
        { ...INITIAL_CONFIG.colors }
      ),
      suggestedPrompts: Array.isArray(parsed.suggestedPrompts)
        ? parsed.suggestedPrompts
        : INITIAL_CONFIG.suggestedPrompts,
    };
  } catch {
    return INITIAL_CONFIG;
  }
}

function saveConfig(config: AppConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // localStorage unavailable (private browsing quota exceeded etc.) — silently ignore
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
}

export function useSettings(): UseSettingsResult {
  const [config, setConfig] = useState<AppConfig>(loadConfig);
  const [draft, setDraft] = useState<AppConfig>(loadConfig);
  const [modalOpen, setModalOpen] = useState(false);
  // true on first visit — no mapItemId stored yet
  const [needsMapId, setNeedsMapId] = useState(() => !loadConfig().mapItemId);

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

  // Persist config to localStorage on every change
  useEffect(() => {
    saveConfig(config);
  }, [config]);

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
    setConfig(next);
    setModalOpen(false);
  }, [draft]);

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
  };
}
