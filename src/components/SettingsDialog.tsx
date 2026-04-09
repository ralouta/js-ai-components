import { useRef } from "react";
import type React from "react";
import type { Colors, ColorKey } from "../types/settings.js";
import { COLOR_LABELS, COLOR_DEFAULTS, FONT_OPTIONS } from "../constants/settings.js";

import "@esri/calcite-components/dist/components/calcite-dialog";
import "@esri/calcite-components/dist/components/calcite-tabs";
import "@esri/calcite-components/dist/components/calcite-tab-nav";
import "@esri/calcite-components/dist/components/calcite-tab-title";
import "@esri/calcite-components/dist/components/calcite-tab";
import "@esri/calcite-components/dist/components/calcite-block";
import "@esri/calcite-components/dist/components/calcite-label";
import "@esri/calcite-components/dist/components/calcite-input";
import "@esri/calcite-components/dist/components/calcite-button";
import "@esri/calcite-components/dist/components/calcite-action";
import "@esri/calcite-components/dist/components/calcite-icon";

interface Props {
  dialogRef: React.RefObject<HTMLCalciteDialogElement | null>;
  draft: {
    appTitle: string;
    mapItemId: string;
    chatHeading: string;
    chatDescription: string;
    colors: Colors;
    fontFamily: string;
    suggestedPrompts: string[];
    logoUrl: string;
  };
  onSetMapId: (v: string) => void;
  onSetTitle: (v: string) => void;
  onSetHeading: (v: string) => void;
  onSetDescription: (v: string) => void;
  onSetColor: (key: ColorKey, value: string) => void;
  onSetFontFamily: (v: string) => void;
  onSetLogoUrl: (v: string) => void;
  onAddPrompt: () => void;
  onUpdatePrompt: (index: number, value: string) => void;
  onRemovePrompt: (index: number) => void;
  onApply: () => void;
  onCancel: () => void;
}


interface LogoSelectorProps {
  logoUrl: string;
  onSetLogoUrl: (v: string) => void;
}

function LogoSelector({ logoUrl, onSetLogoUrl }: LogoSelectorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isDataUrl = logoUrl.startsWith("data:");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onSetLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="logo-selector">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="logo-file-hidden"
        onChange={handleFile}
      />

      {/* Preview area — always visible, shows placeholder or image */}
      <div className="logo-preview-area">
        {logoUrl ? (
          <img src={logoUrl} alt="App logo" className="logo-preview-img" />
        ) : (
          <div className="logo-empty-state">
            <calcite-icon icon="image" scale="l" />
            <span>No logo set</span>
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="logo-actions">
        <calcite-button
          appearance="solid"
          kind="neutral"
          icon-start="attachment"
          scale="s"
          onClick={() => fileRef.current?.click()}
        >
          {logoUrl ? "Replace Image" : "Upload Image"}
        </calcite-button>
        {logoUrl && (
          <calcite-button
            appearance="outline"
            kind="danger"
            icon-start="trash"
            scale="s"
            onClick={() => onSetLogoUrl("")}
          >
            Remove
          </calcite-button>
        )}
      </div>

      {/* URL input — hidden when a data URL is active (already uploaded locally) */}
      {!isDataUrl && (
        <calcite-label className="logo-url-label">
          <span className="logo-url-title">
            <calcite-icon icon="link" scale="s" />
            Paste a URL
          </span>
          <calcite-input
            type="text"
            value={logoUrl}
            onInput={(e: React.FormEvent<HTMLElement>) =>
              onSetLogoUrl((e.target as HTMLInputElement).value)
            }
            placeholder="https://example.com/logo.png"
            clearable
          />
        </calcite-label>
      )}
      {isDataUrl && (
        <p className="logo-local-hint">
          <calcite-icon icon="check-circle" scale="s" />
          Local file loaded — remove to use a URL instead.
        </p>
      )}
    </div>
  );
}

interface ColorRowProps {
  colorKey: ColorKey;
  value: string;
  onChange: (key: ColorKey, value: string) => void;
}

function ColorRow({ colorKey, value, onChange }: ColorRowProps) {
  return (
    <div className="color-row">
      <span className="color-row-label">{COLOR_LABELS[colorKey]}</span>
      <div className="color-row-controls">
        <input
          type="color"
          className="native-color-picker"
          value={value || COLOR_DEFAULTS[colorKey]}
          onChange={(e) => onChange(colorKey, e.target.value)}
        />
        {value && (
          <calcite-action
            icon="reset"
            text="Reset"
            text-enabled
            scale="s"
            appearance="transparent"
            onClick={() => onChange(colorKey, "")}
          />
        )}
      </div>
    </div>
  );
}

function inputVal(e: React.FormEvent<HTMLElement>): string {
  return (e.target as HTMLInputElement).value;
}

export function SettingsDialog({
  dialogRef,
  draft,
  onSetMapId,
  onSetTitle,
  onSetHeading,
  onSetDescription,
  onSetColor,
  onSetFontFamily,
  onSetLogoUrl,
  onAddPrompt,
  onUpdatePrompt,
  onRemovePrompt,
  onApply,
  onCancel,
}: Props) {
  return (
    <calcite-dialog
      ref={dialogRef}
      heading="App Settings"
      modal
      scale="m"
      width-scale="m"
      slot="dialogs"
    >
      <calcite-tabs>
        <calcite-tab-nav slot="title-group">
          <calcite-tab-title tab="map" selected>Map</calcite-tab-title>
          <calcite-tab-title tab="appearance">Appearance</calcite-tab-title>
          <calcite-tab-title tab="content">Content</calcite-tab-title>
        </calcite-tab-nav>

        {/* ── Tab 1: Map ── */}
        <calcite-tab tab="map" selected>
          <div className="tab-content">
            <calcite-block heading="WebMap" open>
              <calcite-label>
                <span className="label-with-icon">
                  <calcite-icon icon="map" scale="s" />
                  WebMap Item ID
                </span>
                <calcite-input
                  type="text"
                  value={draft.mapItemId}
                  onInput={(e: React.FormEvent<HTMLElement>) => onSetMapId(inputVal(e))}
                  placeholder="e.g. 08c575da22334989bc736b8c78d72ae2"
                />
              </calcite-label>
            </calcite-block>
          </div>
        </calcite-tab>

        {/* ── Tab 2: Appearance ── */}
        <calcite-tab tab="appearance">
          <div className="tab-content">
            <calcite-block heading="Layout Colors" open>
              {(["accentColor", "headerBg", "chatHeaderBg", "chatBg"] as ColorKey[]).map((key) => (
                <ColorRow key={key} colorKey={key} value={draft.colors[key]} onChange={onSetColor} />
              ))}
            </calcite-block>
            <calcite-block heading="Chat Input" open>
              {(["chatInputBg", "chatInputText"] as ColorKey[]).map((key) => (
                <ColorRow key={key} colorKey={key} value={draft.colors[key]} onChange={onSetColor} />
              ))}
            </calcite-block>
            <calcite-block heading="Suggested Prompts" open>
              {(["promptBg", "promptText"] as ColorKey[]).map((key) => (
                <ColorRow key={key} colorKey={key} value={draft.colors[key]} onChange={onSetColor} />
              ))}
            </calcite-block>
            <calcite-block heading="User Messages" open>
              {(["userMsgBg", "userMsgText"] as ColorKey[]).map((key) => (
                <ColorRow key={key} colorKey={key} value={draft.colors[key]} onChange={onSetColor} />
              ))}
            </calcite-block>
            <calcite-block heading="Assistant Reply" open>
              {(["assistantReplyBg", "assistantReplyText"] as ColorKey[]).map((key) => (
                <ColorRow key={key} colorKey={key} value={draft.colors[key]} onChange={onSetColor} />
              ))}
            </calcite-block>
            <calcite-block heading="Typography" open>
              <calcite-label>
                Font Family
                <select
                  className="native-select"
                  value={draft.fontFamily}
                  onChange={(e) => onSetFontFamily(e.target.value)}
                >
                  {FONT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </calcite-label>
            </calcite-block>

            <calcite-block heading="Logo" open>
              <LogoSelector logoUrl={draft.logoUrl} onSetLogoUrl={onSetLogoUrl} />
            </calcite-block>
          </div>
        </calcite-tab>

        {/* ── Tab 3: Content ── */}
        <calcite-tab tab="content">
          <div className="tab-content">
            <calcite-block heading="App" open>
              <calcite-label>
                App Title
                <calcite-input
                  type="text"
                  value={draft.appTitle}
                  onInput={(e: React.FormEvent<HTMLElement>) => onSetTitle(inputVal(e))}
                  placeholder="e.g. Lebanon 2026 Response Data"
                />
              </calcite-label>
            </calcite-block>

            <calcite-block heading="Chat Assistant" open>
              <calcite-label>
                Panel Heading
                <calcite-input
                  type="text"
                  value={draft.chatHeading}
                  onInput={(e: React.FormEvent<HTMLElement>) => onSetHeading(inputVal(e))}
                  placeholder="e.g. Map Assistant"
                />
              </calcite-label>
              <calcite-label>
                Panel Description
                <calcite-input
                  type="text"
                  value={draft.chatDescription}
                  onInput={(e: React.FormEvent<HTMLElement>) => onSetDescription(inputVal(e))}
                  placeholder="e.g. Ask questions about the map data."
                />
              </calcite-label>
            </calcite-block>

            <calcite-block heading="Suggested Prompts" open>
              {draft.suggestedPrompts.map((prompt, i) => (
                <div key={i} className="prompt-row">
                  <calcite-input
                    type="text"
                    value={prompt}
                    onInput={(e: React.FormEvent<HTMLElement>) => onUpdatePrompt(i, inputVal(e))}
                    placeholder="Enter a suggested prompt"
                  />
                  <calcite-action
                    icon="trash"
                    text="Remove prompt"
                    scale="s"
                    onClick={() => onRemovePrompt(i)}
                  />
                </div>
              ))}
              <calcite-button appearance="outline" icon-start="plus" scale="s" onClick={onAddPrompt}>
                Add Prompt
              </calcite-button>
            </calcite-block>
          </div>
        </calcite-tab>
      </calcite-tabs>

      <calcite-button slot="footer-start" appearance="outline" onClick={onCancel}>Cancel</calcite-button>
      <calcite-button slot="footer-end" kind="brand" icon-start="save" onClick={onApply}>{"Save & Apply"}</calcite-button>
    </calcite-dialog>
  );
}
