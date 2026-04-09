import { useEffect, useRef, useState } from "react";
import type React from "react";

import "@esri/calcite-components/dist/components/calcite-dialog";
import "@esri/calcite-components/dist/components/calcite-label";
import "@esri/calcite-components/dist/components/calcite-input";
import "@esri/calcite-components/dist/components/calcite-button";
import "@esri/calcite-components/dist/components/calcite-icon";
import "@esri/calcite-components/dist/components/calcite-notice";

interface Props {
  onConfirm: (mapItemId: string) => void;
}

export function MapIdDialog({ onConfirm }: Props) {
  const dialogRef = useRef<HTMLCalciteDialogElement | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  // Open the dialog as soon as it mounts
  useEffect(() => {
    const el = dialogRef.current;
    if (el) el.open = true;
  }, []);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError(true);
      return;
    }
    setError(false);
    if (dialogRef.current) dialogRef.current.open = false;
    onConfirm(trimmed);
  }

  function handleInput(e: React.FormEvent<HTMLElement>) {
    setValue((e.target as HTMLInputElement).value);
    setError(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <calcite-dialog
      ref={dialogRef}
      heading="Welcome — Load a WebMap"
      description="Enter the ArcGIS WebMap Item ID to get started."
      modal
      scale="m"
      width-scale="s"
      close-disabled
      escape-disabled
      outside-close-disabled
      slot="dialogs"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "0.25rem 0 0.5rem" }}>
        <calcite-notice kind="brand" open scale="s" icon="lightbulb">
          <div slot="title">Before you begin</div>
          <div slot="message">
            The AI assistant requires WebMap embeddings to be generated. Open your WebMap item in
            ArcGIS Online, go to <strong>Settings → Manage AI vector embeddings → Generate embeddings</strong> before loading it here.
          </div>
        </calcite-notice>

        <calcite-label>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
            <calcite-icon icon="map" scale="s" />
            WebMap Item ID
          </span>
          <calcite-input
            type="text"
            placeholder="e.g. 08c575da22334989bc736b8c78d72ae2"
            value={value}
            status={error ? "invalid" : "idle"}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </calcite-label>

        {error && (
          <calcite-notice kind="danger" open scale="s">
            <div slot="message">Please enter a WebMap Item ID.</div>
          </calcite-notice>
        )}
      </div>

      <calcite-button
        slot="footer-end"
        kind="brand"
        icon-start="map"
        onClick={handleSubmit}
      >
        Load Map
      </calcite-button>
    </calcite-dialog>
  );
}
