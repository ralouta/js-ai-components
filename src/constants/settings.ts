import type { Colors, ColorKey } from "../types/settings.js";

export const DEFAULT_LOGO_URL = "";
export const DEFAULT_APP_TITLE = "AI Components | JavaScript";
export const DEFAULT_CHAT_HEADING = "Map Assistant";
export const DEFAULT_CHAT_DESCRIPTION = "Ask questions about the map and its data.";

export const DEFAULT_PROMPTS: string[] = [
  "What layers are in this map?",
  "Summarize the features near the center.",
  "How many features are visible?",
];

export const DEFAULT_COLORS: Colors = {
  accentColor: "",
  headerBg: "",
  chatHeaderBg: "",
  chatBg: "",
  chatInputBg: "",
  chatInputText: "",
  promptBg: "",
  promptText: "",
  userMsgBg: "",
  userMsgText: "",
  assistantReplyBg: "#ffffff",
  assistantReplyText: "#141414",
};

export const COLOR_VARS: Record<ColorKey, readonly string[]> = {
  // Set directly on :root — Calcite 5 component-level CSS custom properties
  accentColor: ["--calcite-color-brand", "--calcite-color-brand-hover", "--calcite-color-brand-press"],
  headerBg: ["--calcite-navigation-background-color"],
  chatHeaderBg: ["--calcite-panel-header-background-color"],
  chatBg: ["--calcite-panel-background-color", "--calcite-shell-panel-background-color"],
  // Scoped via a <style> tag targeting arcgis-assistant (see applyChatScopedColors)
  // The chat entry uses calcite-text-area, and prompts use calcite-chip
  chatInputBg: ["--calcite-text-area-background-color"],
  chatInputText: ["--calcite-text-area-text-color"],
  promptBg: ["--calcite-chip-background-color"],
  promptText: ["--calcite-chip-text-color"],
  // Handled via shadow DOM injection in applyColor (see below)
  userMsgBg: [],
  userMsgText: [],
  // Handled via shadow DOM injection in applyColor (see below)
  assistantReplyBg: [],
  assistantReplyText: [],
};

export const COLOR_LABELS: Record<ColorKey, string> = {
  accentColor: "Accent / Brand",
  headerBg: "Navigation Header",
  chatHeaderBg: "Chat Panel Header Bar",
  chatBg: "Chat Background",
  chatInputBg: "Chat Input Background",
  chatInputText: "Chat Input Text",
  promptBg: "Prompt Chip Background",
  promptText: "Prompt Chip Text",
  userMsgBg: "User Message Background",
  userMsgText: "User Message Text",
  assistantReplyBg: "Assistant Reply Background",
  assistantReplyText: "Assistant Reply Text",
};

export const COLOR_DEFAULTS: Record<ColorKey, string> = {
  accentColor: "#007ac2",
  headerBg: "#f3f3f3",
  chatHeaderBg: "#f3f3f3",
  chatBg: "#ffffff",
  chatInputBg: "#ffffff",
  chatInputText: "#1b1b1b",
  promptBg: "#e3f0fa",
  promptText: "#00619b",
  userMsgBg: "#d4eaf7",
  userMsgText: "",
  assistantReplyBg: "",
  assistantReplyText: "",
};

export const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: "System Default", value: "" },
  { label: "Arial / Helvetica", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', Tahoma, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
];

// ── Chat-scoped tokens (arcgis-assistant host element) ─────────────────────
// chatInputBg/Text and promptBg/Text are set as CSS variables on the
// arcgis-assistant element so they cascade into its shadow DOM without
// bleeding into settings-dialog inputs.
const CHAT_SCOPED_KEYS = new Set<ColorKey>(["chatInputBg", "chatInputText", "promptBg", "promptText"]);
const CHAT_STYLE_ID = "arcgis-assistant-color-overrides";
const chatColorState: Partial<Record<ColorKey, string>> = {};

function rebuildChatStyleTag(): void {
  let styleEl = document.getElementById(CHAT_STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = CHAT_STYLE_ID;
    document.head.appendChild(styleEl);
  }
  const decls: string[] = [];
  for (const key of CHAT_SCOPED_KEYS) {
    const value = chatColorState[key];
    if (value) {
      for (const prop of COLOR_VARS[key]) {
        decls.push(`  ${prop}: ${value};`);
      }
    }
  }
  styleEl.textContent =
    decls.length > 0 ? `arcgis-assistant {\n${decls.join("\n")}\n}` : "";
}

// ── Chat-card shadow DOM injection ──────────────────────────────────────────
// arcgis-assistant-chat-card renders INSIDE the shadow root of
// arcgis-assistant-chat, which is itself inside arcgis-assistant's shadow.
// MutationObserver on document.body cannot see additions inside shadow roots,
// so we walk the open shadow root chain and attach observers to each level.
//
// Injected CSS targets:
//   .assistant-chat-card__prompt-container  — user message bubble
//   .assistant-chat-card__response-container — assistant reply area
//   .assistant-chat-card-content__text-container — assistant reply text

const SHADOW_STYLE_ID = "app-chat-card-overrides";
const SHADOW_KEYS = new Set<ColorKey>(["userMsgBg", "userMsgText", "assistantReplyBg", "assistantReplyText"]);
const shadowColorState: Partial<Record<ColorKey, string>> = {};

function buildChatCardCss(): string {
  const userBg = shadowColorState.userMsgBg;
  const userTxt = shadowColorState.userMsgText;
  const aiBg = shadowColorState.assistantReplyBg;
  const aiTxt = shadowColorState.assistantReplyText;
  const NL = "\n";
  const blocks: string[] = [];
  if (userBg || userTxt) {
    const rules: string[] = [];
    if (userBg) rules.push("  background: " + userBg + " !important;");
    if (userTxt) rules.push("  color: " + userTxt + " !important;");
    blocks.push(".assistant-chat-card__prompt-container {" + NL + rules.join(NL) + NL + "}");
  }
  if (aiBg || aiTxt) {
    const containerRules: string[] = [];
    if (aiBg) containerRules.push("  background: " + aiBg + ";");
    if (aiTxt) containerRules.push("  color: " + aiTxt + " !important;");
    blocks.push(".assistant-chat-card__response-container {" + NL + containerRules.join(NL) + NL + "}");
    if (aiTxt) {
      blocks.push(".assistant-chat-card-content__text-container {" + NL + "  color: " + aiTxt + " !important;" + NL + "}");
    }
  }
  return blocks.join(NL);
}

/** Inject or update the override <style> tag in a chat-card shadow root. */
function injectIntoChatCard(el: Element): void {
  const root = el.shadowRoot;
  if (!root) return;
  let styleEl = root.getElementById(SHADOW_STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = SHADOW_STYLE_ID;
    root.appendChild(styleEl);
  }
  styleEl.textContent = buildChatCardCss();
}

/** Walk the full open-shadow-root chain to find all chat-card elements. */
function collectChatCards(root: Element | ShadowRoot, results: Element[] = []): Element[] {
  const sr = root instanceof Element ? root.shadowRoot : root;
  if (!sr) return results;
  sr.querySelectorAll("arcgis-assistant-chat-card").forEach((el) => results.push(el));
  // Also recurse into any intermediate shadow hosts found at this level
  sr.querySelectorAll("*").forEach((child) => {
    if (child.shadowRoot) collectChatCards(child, results);
  });
  return results;
}

/** Re-inject into all existing chat-cards (debounced to avoid thrashing). */
let rebuildTimer: ReturnType<typeof setTimeout> | null = null;
function rebuildShadowStyles(): void {
  if (rebuildTimer !== null) clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    rebuildTimer = null;
    const assistant = document.querySelector("arcgis-assistant");
    if (!assistant) return;
    collectChatCards(assistant).forEach(injectIntoChatCard);
  }, 50);
}

let chainObservers: MutationObserver[] = [];

/** Attach observers to every open shadow root in the chain so we catch new cards. */
function observeShadowChain(host: Element): void {
  const root = host.shadowRoot;
  if (!root) return;
  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      // Only care about element additions — skip characterData / attribute changes
      // that fire constantly during streaming text updates
      if (m.type !== "childList" || m.addedNodes.length === 0) continue;
      for (const node of m.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.tagName.toLowerCase() === "arcgis-assistant-chat-card") {
          injectIntoChatCard(node);
        }
        // If a new shadow host appeared, start observing it too
        if (node.shadowRoot) observeShadowChain(node);
      }
    }
  });
  // childList + subtree to catch cards added inside nested divs within this
  // shadow root. characterData is intentionally excluded — streaming response
  // text triggers hundreds of characterData mutations per message and those
  // must not trigger our recursive querySelectorAll scan.
  obs.observe(root, { childList: true, subtree: true });
  chainObservers.push(obs);
  // Recurse into already-existing shadow hosts inside this root
  root.querySelectorAll("*").forEach((child) => {
    if (child.shadowRoot) observeShadowChain(child);
  });
}

let shadowBootstrapped = false;

function bootstrapShadowObserver(): void {
  if (shadowBootstrapped) return;
  const assistant = document.querySelector("arcgis-assistant");
  if (!assistant) {
    // Not in the DOM yet — wait for it with a light-DOM observer
    const waitObs = new MutationObserver(() => {
      const el = document.querySelector("arcgis-assistant");
      if (el) {
        waitObs.disconnect();
        observeShadowChain(el);
        rebuildShadowStyles();
        shadowBootstrapped = true;
      }
    });
    waitObs.observe(document.body, { childList: true, subtree: true });
    return;
  }
  observeShadowChain(assistant);
  rebuildShadowStyles();
  shadowBootstrapped = true;
}

export function applyColor(key: ColorKey, value: string): void {
  if (SHADOW_KEYS.has(key)) {
    if (value) {
      shadowColorState[key] = value;
    } else {
      delete shadowColorState[key];
    }
    bootstrapShadowObserver();
    rebuildShadowStyles();
    return;
  }
  if (CHAT_SCOPED_KEYS.has(key)) {
    if (value) {
      chatColorState[key] = value;
    } else {
      delete chatColorState[key];
    }
    rebuildChatStyleTag();
    return;
  }
  // Global tokens — set directly on :root
  for (const prop of COLOR_VARS[key]) {
    if (value) {
      document.documentElement.style.setProperty(prop, value);
    } else {
      document.documentElement.style.removeProperty(prop);
    }
  }
}
