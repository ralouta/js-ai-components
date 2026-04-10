# ArcGIS AI Components Demo

> A React + TypeScript web app that loads an ArcGIS web map and pairs it with an AI assistant panel for natural-language exploration of the data. The entire look-and-feel is configurable at runtime — no code changes needed.

## Features

- **First-launch map ID dialog** — prompts for a WebMap Item ID on first visit; persists to `localStorage`
- **OAuth 2.0 sign-in** — redirect-based via ArcGIS `OAuthInfo` + `IdentityManager`; user menu with avatar, name, sign-out, and switch-account
- **ArcGIS web map** — loaded by item ID; zooms to the saved extent on load
- **Map widgets** — zoom, home, compass, legend, and layer list with expand/collapse
- **AI assistant panel** — three pre-configured agents: navigation, data-exploration, and help
- **Runtime settings** (`?mode=edit`) — configure app title, logo, chat heading, suggested prompts, font, and colors without touching code
- **Color theming** — full color control including chat input, suggested prompt chips, user message bubbles, and assistant reply backgrounds (shadow DOM injection)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A registered OAuth application at [developers.arcgis.com](https://developers.arcgis.com)
- An ArcGIS Online web map with **AI vector embeddings generated**
  (WebMap item → Settings → Manage AI vector embeddings → Generate embeddings)

### Environment Setup

Create a `.env` file in the project root:

```env
VITE_ARCGIS_CLIENT_ID=your_oauth_app_id
VITE_PORTAL_URL=https://www.arcgis.com
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_ARCGIS_CLIENT_ID` | Yes | OAuth client ID registered for this app |
| `VITE_PORTAL_URL` | No | Portal base URL; defaults to `https://www.arcgis.com` |

> The WebMap Item ID is not stored in `.env`. It is entered by the user on first launch and saved to `localStorage`.

### Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. On first visit you will be prompted for a WebMap Item ID.

### Build for Production

```bash
npm run build
npm run preview
```

## Settings (`?mode=edit`)

Append `?mode=edit` to the URL to open the settings dialog. Changes are saved to `localStorage` and applied immediately. Configurable options:

| Tab | Options |
|-----|---------|
| General | App title, map item ID, chat heading, chat description |
| Appearance | Logo (URL or file upload), font family, 12 color slots |
| Prompts | Suggested prompts list |

> **Note:** Changing the map item ID triggers an automatic page reload so the `arcgis-assistant` component reconnects to the new map. All other setting changes apply in-place without a reload.

## Architecture

```
App.tsx
├── MapIdDialog          — first-launch gate (renders if no mapItemId in localStorage)
├── calcite-shell
│   ├── calcite-navigation (header)
│   │   └── UserMenu → calcite-navigation-user + calcite-popover (portaled to <body>)
│   ├── MapView (default slot)
│   │   └── arcgis-map → arcgis-zoom, arcgis-home, arcgis-compass, arcgis-expand > arcgis-legend, arcgis-expand > arcgis-layer-list
│   └── AssistantPanel (panel-end slot)
│       └── arcgis-assistant
│           ├── arcgis-assistant-navigation-agent
│           ├── arcgis-assistant-data-exploration-agent
│           └── arcgis-assistant-help-agent
```

## Project Structure

```
src/
  auth.ts                    # OAuth setup, signOut(), switchAccount()
  constants/settings.ts      # Default config, color tokens, shadow DOM injection
  types/settings.ts          # AppConfig, Colors, ColorKey types
  hooks/
    useAuth.ts               # Auth state hook
    useSettings.ts           # Settings state, persistence, applyColor
  components/
    MapIdDialog.tsx          # First-launch WebMap ID prompt
    MapView.tsx              # arcgis-map + widgets
    AssistantPanel.tsx       # arcgis-assistant with three agents
    SettingsDialog.tsx       # ?mode=edit settings UI
    UserMenu.tsx             # Nav bar user chip + popover
  App.tsx
  main.tsx
  style.css
```
