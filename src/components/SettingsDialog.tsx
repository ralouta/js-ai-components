import { useRef } from "react";
import type React from "react";
import type { AppConfig, ColorKey } from "../types/settings.js";
import { COLOR_DEFAULTS, COLOR_LABELS, FONT_OPTIONS } from "../constants/settings.js";

import "@esri/calcite-components/dist/components/calcite-dialog";
import "@esri/calcite-components/dist/components/calcite-tabs";
import "@esri/calcite-components/dist/components/calcite-tab-nav";
import "@esri/calcite-components/dist/components/calcite-tab-title";
import "@esri/calcite-components/dist/components/calcite-tab";
import "@esri/calcite-components/dist/components/calcite-block";
import "@esri/calcite-components/dist/components/calcite-label";
import "@esri/calcite-components/dist/components/calcite-input";
import "@esri/calcite-components/dist/components/calcite-text-area";
import "@esri/calcite-components/dist/components/calcite-button";
import "@esri/calcite-components/dist/components/calcite-action";
import "@esri/calcite-components/dist/components/calcite-icon";
import "@esri/calcite-components/dist/components/calcite-notice";

const COLOR_KEYS: ColorKey[] = [
	"accentColor",
	"headerBg",
	"headerText",
	"chatHeaderBg",
	"chatBg",
	"chatInputBg",
	"chatInputText",
	"promptBg",
	"promptText",
	"userMsgBg",
	"userMsgText",
	"assistantReplyBg",
	"assistantReplyText",
];

interface Props {
	dialogRef: React.RefObject<HTMLCalciteDialogElement | null>;
	draft: AppConfig;
	onSetMapId: (value: string) => void;
	onSetTitle: (value: string) => void;
	onSetHeading: (value: string) => void;
	onSetDescription: (value: string) => void;
	onSetColor: (key: ColorKey, value: string) => void;
	onSetFontFamily: (value: string) => void;
	onSetLogoUrl: (value: string) => void;
	onAddPrompt: () => void;
	onUpdatePrompt: (index: number, value: string) => void;
	onRemovePrompt: (index: number) => void;
	remoteSaveError: string | null;
	onApply: () => void;
	onCancel: () => void;
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
	remoteSaveError,
	onApply,
	onCancel,
}: Props) {
	const logoFileRef = useRef<HTMLInputElement | null>(null);

	function handleColorPickerChange(key: ColorKey, event: React.ChangeEvent<HTMLInputElement>) {
		onSetColor(key, event.target.value);
	}

	function handleLogoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				onSetLogoUrl(reader.result);
			}
		};
		reader.readAsDataURL(file);
		event.target.value = "";
	}

	return (
		<calcite-dialog
			ref={dialogRef}
			heading="Settings"
			description="Customize the map experience, appearance, and assistant content."
			modal
			scale="m"
			width-scale="l"
			slot="dialogs"
		>
			<calcite-tabs>
				<calcite-tab-nav slot="title-group">
					<calcite-tab-title selected>Map</calcite-tab-title>
					<calcite-tab-title>Appearance</calcite-tab-title>
					<calcite-tab-title>Content</calcite-tab-title>
				</calcite-tab-nav>

				<calcite-tab selected>
					<div className="tab-content">
						<calcite-block heading="Map" open>
							<calcite-label>
								<span className="label-with-icon">
									<calcite-icon icon="map" scale="s" />
									WebMap Item ID
								</span>
								<calcite-input
									type="text"
									value={draft.mapItemId}
									placeholder="e.g. 08c575da22334989bc736b8c78d72ae2"
									onInput={(event) => onSetMapId((event.target as HTMLInputElement).value)}
								/>
							</calcite-label>

							<calcite-label>
								Application Title
								<calcite-input
									type="text"
									value={draft.appTitle}
									placeholder="Application title"
									onInput={(event) => onSetTitle((event.target as HTMLInputElement).value)}
								/>
							</calcite-label>
						</calcite-block>
					</div>
				</calcite-tab>

				<calcite-tab>
					<div className="tab-content">
						<calcite-block heading="Typography" open>
							<label>
								<span>Font Family</span>
								<select
									className="native-select"
									value={draft.fontFamily}
									onChange={(event) => onSetFontFamily(event.target.value)}
								>
									{FONT_OPTIONS.map((option) => (
										<option key={option.label} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</label>
						</calcite-block>

						<calcite-block heading="Colors" open>
							{COLOR_KEYS.map((key) => {
								const colorValue = draft.colors[key];
								return (
									<div className="color-row" key={key}>
										<div className="color-row-label">{COLOR_LABELS[key]}</div>
										<div className="color-row-controls">
											<input
												className="native-color-picker"
												type="color"
												value={colorValue || COLOR_DEFAULTS[key]}
												onChange={(event) => handleColorPickerChange(key, event)}
												aria-label={COLOR_LABELS[key]}
											/>
											{colorValue && (
												<calcite-action
													icon="reset"
													text={`Reset ${COLOR_LABELS[key]}`}
													onClick={() => onSetColor(key, "")}
												/>
											)}
										</div>
									</div>
								);
							})}
						</calcite-block>

						<calcite-block heading="Logo" open>
							<div className="logo-selector">
								<div className="logo-preview-area">
									{draft.logoUrl ? (
										<img className="logo-preview-img" src={draft.logoUrl} alt="Application logo preview" />
									) : (
										<div className="logo-empty-state">
											<calcite-icon icon="image" scale="m" />
											<span>No logo selected</span>
										</div>
									)}
								</div>

								<div className="logo-actions">
									<input
										ref={logoFileRef}
										className="logo-file-hidden"
										type="file"
										accept="image/*"
										onChange={handleLogoFileChange}
									/>
									<calcite-button
										kind="neutral"
										icon-start="upload"
										onClick={() => logoFileRef.current?.click()}
									>
										Upload Logo
									</calcite-button>
									{draft.logoUrl && (
										<calcite-button kind="neutral" appearance="outline" onClick={() => onSetLogoUrl("")}>
											Clear Logo
										</calcite-button>
									)}
								</div>

								<calcite-label>
									Logo URL
									<calcite-input
										type="url"
										value={draft.logoUrl}
										placeholder="https://example.com/logo.png"
										onInput={(event) => onSetLogoUrl((event.target as HTMLInputElement).value)}
									/>
								</calcite-label>
							</div>
						</calcite-block>
					</div>
				</calcite-tab>

				<calcite-tab>
					<div className="tab-content">
						<calcite-block heading="Assistant Copy" open>
							<calcite-label>
								Assistant Heading
								<calcite-input
									type="text"
									value={draft.chatHeading}
									placeholder="Assistant heading"
									onInput={(event) => onSetHeading((event.target as HTMLInputElement).value)}
								/>
							</calcite-label>

							<calcite-label>
								Description
								<calcite-text-area
									value={draft.chatDescription}
									placeholder="Describe how the assistant should help users."
									onInput={(event) => onSetDescription((event.target as HTMLTextAreaElement).value)}
								/>
							</calcite-label>
						</calcite-block>

						<calcite-block heading="Suggested Prompts" open>
							{draft.suggestedPrompts.map((prompt, index) => (
								<div className="prompt-row" key={`prompt-${index}`}>
									<calcite-input
										type="text"
										value={prompt}
										placeholder="Suggested prompt"
										onInput={(event) => onUpdatePrompt(index, (event.target as HTMLInputElement).value)}
									/>
									<calcite-button
										kind="danger"
										appearance="outline"
										icon-start="trash"
										onClick={() => onRemovePrompt(index)}
										disabled={draft.suggestedPrompts.length === 1}
									>
										Remove
									</calcite-button>
								</div>
							))}

							<calcite-button kind="neutral" icon-start="plus" onClick={onAddPrompt}>
								Add Prompt
							</calcite-button>
						</calcite-block>
					</div>
				</calcite-tab>
			</calcite-tabs>

			{remoteSaveError && (
				<calcite-notice kind="danger" open icon="exclamation-mark-triangle" scale="s">
					<div slot="message">Cloud save failed: {remoteSaveError}</div>
				</calcite-notice>
			)}

			<calcite-button slot="footer-start" kind="neutral" onClick={onCancel}>
				Cancel
			</calcite-button>
			<calcite-button slot="footer-end" kind="brand" onClick={onApply}>
				Save Changes
			</calcite-button>
		</calcite-dialog>
	);
}

export default SettingsDialog;
