import { useEffect, useRef } from "react";
import type { AuthUser } from "../auth.js";
import type { ArcgisAssistant } from "@arcgis/ai-components/components/arcgis-assistant";

import "@arcgis/ai-components/components/arcgis-assistant";
import "@arcgis/ai-components/components/arcgis-assistant-navigation-agent";
import "@arcgis/ai-components/components/arcgis-assistant-data-exploration-agent";
import "@arcgis/ai-components/components/arcgis-assistant-help-agent";
import "@esri/calcite-components/dist/components/calcite-shell-panel";
import "@esri/calcite-components/dist/components/calcite-panel";
import "@esri/calcite-components/dist/components/calcite-action";

interface Props {
  user: AuthUser | null;
  heading: string;
  description: string;
  suggestedPrompts: string[];
  collapsed?: boolean;
  onClose?: () => void;
}

export function AssistantPanel({ user, heading, description, suggestedPrompts, collapsed, onClose }: Props) {
  const assistantRef = useRef<ArcgisAssistant | null>(null);

  useEffect(() => {
    if (!user || !assistantRef.current) return;
    assistantRef.current.suggestedPrompts = suggestedPrompts;
  }, [user, suggestedPrompts]);

  return (
    <calcite-shell-panel slot="panel-end" width="l" collapsed={collapsed || undefined}>
      <calcite-panel>
        {onClose && (
          <calcite-action
            className="mobile-panel-close"
            slot="header-actions-end"
            icon="x"
            text="Close"
            onClick={onClose}
          />
        )}
        <arcgis-assistant
          ref={assistantRef}
          log-enabled
          copy-enabled
          reference-element="#app-map"
          heading={heading}
          description={description}
          entry-message="Hello! Ask me anything about this map."
        >
          <arcgis-assistant-navigation-agent />
          <arcgis-assistant-data-exploration-agent />
          <arcgis-assistant-help-agent />
        </arcgis-assistant>
      </calcite-panel>
    </calcite-shell-panel>
  );
}
