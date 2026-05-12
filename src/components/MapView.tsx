import { useEffect, useRef } from "react";
import type WebMap from "@arcgis/core/WebMap.js";
import type { ArcgisMap } from "@arcgis/map-components/dist/components/arcgis-map";

import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-compass";
import "@arcgis/map-components/components/arcgis-expand";
import "@arcgis/map-components/components/arcgis-legend";
import "@arcgis/map-components/components/arcgis-layer-list";
import "@arcgis/map-components/components/arcgis-home";
import "@arcgis/map-components/components/arcgis-basemap-gallery";

interface Props {
  mapItemId: string;
}

export function MapView({ mapItemId }: Props) {
  const mapRef = useRef<ArcgisMap | null>(null);

  // Zoom to the webmap's saved initial extent whenever the map becomes ready.
  // This fires both on first load and after a new item-id is applied.
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;

    function handleReady() {
      const view = mapRef.current;
      if (!view) return;
      const vp = (view.map as WebMap | undefined)?.initialViewProperties?.viewpoint;
      if (vp) {
        view.goTo(vp, { animate: true }).catch(() => {
          // goTo may throw if the view is destroyed before animation completes
        });
      }
    }

    el.addEventListener("arcgisViewReadyChange", handleReady);
    return () => el.removeEventListener("arcgisViewReadyChange", handleReady);
  }, []);

  return (
    // key forces a full remount when the item ID changes, so the map reloads
    // and arcgisViewReadyChange fires again with the new item's initial extent
    <arcgis-map key={mapItemId} ref={mapRef} id="app-map" item-id={mapItemId}>
      <arcgis-zoom slot="top-left" />
      <arcgis-home slot="top-left" />
      <arcgis-compass slot="bottom-right" />
      <arcgis-expand slot="top-left">
        <arcgis-legend />
      </arcgis-expand>
      <arcgis-expand slot="top-left">
        <arcgis-layer-list />
      </arcgis-expand>
      <arcgis-expand slot="top-left">
        <arcgis-basemap-gallery />
      </arcgis-expand>
    </arcgis-map>
  );
}
