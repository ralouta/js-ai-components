/// <reference types="vite/client" />

import "@esri/calcite-components/types/react";
import "@arcgis/map-components/types/react";
import "@arcgis/ai-components/types/react";

interface ImportMetaEnv {
  readonly VITE_ARCGIS_CLIENT_ID: string;
  readonly VITE_PORTAL_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
