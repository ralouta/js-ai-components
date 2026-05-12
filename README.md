# ArcGIS AI Components Demo

> A React + TypeScript web app that loads an ArcGIS web map and pairs it with an AI assistant panel for natural-language exploration of the data. The entire look-and-feel is configurable at runtime — no code changes needed.

## Demo

[![Watch the demo on YouTube](https://img.youtube.com/vi/ltIho0DPVQg/maxresdefault.jpg)](https://youtu.be/ltIho0DPVQg)

## Features

- **OAuth 2.0 sign-in** — standalone mode uses ArcGIS `OAuthInfo` + `IdentityManager`; embedded mode uses a popup relay so sign-in completes once without duplicate prompts; user menu shows avatar, name, and sign-out
- **ArcGIS web map** — loaded by item ID; zooms to the saved extent on load
- **Map widgets** — zoom, home, compass, legend, and layer list with expand/collapse
- **AI assistant panel** — three pre-configured agents: navigation, data-exploration, and help
- **Runtime settings** (`?mode=edit`) — configure app title, logo, chat heading, suggested prompts, font, and colors without touching code
- **Color theming** — full color control including chat input, suggested prompt chips, user message bubbles, and assistant reply backgrounds
- **Cross-browser config persistence** — optionally store settings in an ArcGIS Online item so configuration is shared across browsers and devices

## Prerequisites

- **Node.js 18+** and npm
- A registered **OAuth application** at [developers.arcgis.com](https://developers.arcgis.com)
- An ArcGIS Online **web map** with AI vector embeddings generated
  (WebMap item → Settings → Manage AI vector embeddings → Generate embeddings)

For cloud deployment (optional):
- [Docker](https://docs.docker.com/get-docker/)
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) with the `containerapp` extension
- An Azure Container Registry (ACR) and Container Apps environment

## Configuration

All configuration lives in a single `.env` file. Copy the template and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_ARCGIS_CLIENT_ID` | Yes | OAuth client ID from [developers.arcgis.com](https://developers.arcgis.com) |
| `VITE_PORTAL_URL` | No | Portal base URL (default: `https://www.arcgis.com`) |
| `VITE_MAP_ITEM_ID` | No | Default WebMap item ID shown on first load |
| `VITE_APP_TITLE` | No | Application title in the header |
| `VITE_CONFIG_ITEM_ID` | No | ArcGIS item ID for cross-browser config persistence (see below) |
| `AZURE_ACR_NAME` | No | Azure Container Registry name — only needed for `deploy.sh` |
| `AZURE_RESOURCE_GROUP` | No | Azure resource group — only needed for `deploy.sh` |
| `AZURE_APP_NAME` | No | Azure Container App name — only needed for `deploy.sh` |

## Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Deploy to Azure (Optional)

If you filled in the `AZURE_*` variables in `.env`:

```bash
chmod +x deploy.sh   # first time only
./deploy.sh
```

The script builds a `linux/amd64` Docker image, pushes it to your ACR, updates the Container App, and prints the live URL.

> `VITE_*` variables are baked into the static bundle at build time. To change them, re-run `./deploy.sh`.

## Settings (`?mode=edit`)

Append `?mode=edit` to the URL to open the settings dialog. Configurable options:

| Tab | Options |
|-----|---------|
| General | App title, map item ID, chat heading, chat description |
| Appearance | Logo (URL or file upload), font family, 12 color slots |
| Prompts | Suggested prompts list |

> Changing the map item ID triggers a page reload. All other changes apply in-place.

### Cross-Browser Config Persistence

By default, settings are stored in `localStorage` (per-browser). To share configuration across browsers and devices:

1. Sign in to [ArcGIS Online](https://www.arcgis.com) → **Content** → **My Content**
2. Click **New item** → choose **Application** → select **Web Mapping** as the type
3. Give it a title (e.g. "Agriculture Assistant Config") and click **Save**
4. Open the newly created item → **Settings** tab → **Sharing** → share with **Everyone (public)** so any visitor can read the config
5. Copy the **item ID** from the item's URL (the hex string after `id=`, e.g. `https://www.arcgis.com/home/item.html?id=abc123...`)
6. Add it to your `.env` file:
   ```bash
   VITE_CONFIG_ITEM_ID=abc123...
   ```
7. Restart the dev server or re-run `./deploy.sh` to pick up the change

The app reads config publicly on load and writes on Save & Apply (requires the signed-in user to be the item owner).

## Architecture

```
App.tsx
├── MapIdDialog          — first-launch gate (renders if no mapItemId in localStorage)
├── calcite-shell
│   ├── calcite-navigation (header)
│   │   └── UserMenu → calcite-navigation-user + calcite-popover
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
  auth.ts                    # OAuth setup, embedded popup relay, signOut()
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
deploy.sh                    # One-command Azure Container Apps deployment
.env.example                 # Configuration template
```
