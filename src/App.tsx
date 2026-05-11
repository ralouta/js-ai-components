import { useCallback } from "react";
import { useAuth } from "./hooks/useAuth.js";
import { useSettings } from "./hooks/useSettings.js";
import { useCalciteDialog } from "./hooks/useCalciteDialog.js";
import { UserMenu } from "./components/UserMenu.js";
import { MapView } from "./components/MapView.js";
import { AssistantPanel } from "./components/AssistantPanel.js";
import { SettingsDialog } from "./components/SettingsDialog.js";
import { MapIdDialog } from "./components/MapIdDialog.js";

import "@esri/calcite-components/dist/components/calcite-shell";
import "@esri/calcite-components/dist/components/calcite-navigation";
import "@esri/calcite-components/dist/components/calcite-navigation-logo";
import "@esri/calcite-components/dist/components/calcite-action";
import "@esri/calcite-components/dist/components/calcite-notice";

// Edit mode requires both the URL flag and an org admin/publisher account.
// Public users who append ?mode=edit will not see the settings gear.
const urlRequestsEdit =
  new URLSearchParams(window.location.search).get("mode") === "edit";

export default function App() {
  const { user, authError, signOut, switchAccount } = useAuth();

  const {
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
    remoteSaveError,
    needsMapId,
    confirmMapId,
  } = useSettings();

  const handleClose = useCallback(() => cancelSettings(), [cancelSettings]);
  const dialogRef = useCalciteDialog(modalOpen, handleClose);

  if (authError) {
    return <div className="error">{authError}</div>;
  }

  return (
    <calcite-shell>
      <calcite-navigation slot="header">
        <calcite-navigation-logo
          heading={config.appTitle}
          thumbnail={config.logoUrl || undefined}
          alt="Application logo"
          slot="logo"
        />
        {urlRequestsEdit && user?.canEdit && (
          <calcite-action
            slot="navigation-action"
            icon="gear"
            text="Settings"
            onClick={openSettings}
          />
        )}
        {user && (
          <UserMenu
            slot="user"
            user={user}
            onSignOut={signOut}
            onSwitchAccount={switchAccount}
          />
        )}
      </calcite-navigation>

      <MapView mapItemId={config.mapItemId} />
      <AssistantPanel
        user={user}
        heading={config.chatHeading}
        description={config.chatDescription}
        suggestedPrompts={config.suggestedPrompts}
      />

      {needsMapId && <MapIdDialog onConfirm={confirmMapId} />}

      {urlRequestsEdit && user?.canEdit && (
        <SettingsDialog
          dialogRef={dialogRef}
          draft={draft}
          onSetMapId={setDraftMapId}
          onSetTitle={setDraftTitle}
          onSetHeading={setDraftHeading}
          onSetDescription={setDraftDescription}
          onSetColor={setDraftColor}
          onSetFontFamily={setDraftFontFamily}
          onSetLogoUrl={setDraftLogoUrl}
          onAddPrompt={addPrompt}
          onUpdatePrompt={updatePrompt}
          onRemovePrompt={removePrompt}
          remoteSaveError={remoteSaveError}
          onApply={applySettings}
          onCancel={cancelSettings}
        />
      )}
    </calcite-shell>
  );
}
