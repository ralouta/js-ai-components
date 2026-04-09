import { useEffect, useRef } from "react";
import type { AuthUser } from "../auth.js";
import type { ArcgisAssistant } from "@arcgis/ai-components/components/arcgis-assistant";

import "@arcgis/ai-components/components/arcgis-assistant";
import "@arcgis/ai-components/components/arcgis-assistant-navigation-agent";
import "@arcgis/ai-components/components/arcgis-assistant-data-exploration-agent";
import "@arcgis/ai-components/components/arcgis-assistant-help-agent";
import "@esri/calcite-components/dist/components/calcite-shell-panel";
import "@esri/calcite-components/dist/components/calcite-panel";

interface Props {
  user: AuthUser | null;
  heading: string;
  description: string;
  suggestedPrompts: string[];
}

export function AssistantPanel({ user, heading, description, suggestedPrompts }: Props) {
  const assistantRef = useRef<ArcgisAssistant | null>(null);

  useEffect(() => {
    if (!user || !assistantRef.current) return;
    assistantRef.current.suggestedPrompts = suggestedPrompts;
  }, [user, suggestedPrompts]);

  return (
    <calcite-shell-panel slot="panel-end" width="l">
      <calcite-panel>
        <arcgis-assistant
          ref={assistantRef}
          {...(import.meta.env.DEV ? { "log-enabled": true } : {})}
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
