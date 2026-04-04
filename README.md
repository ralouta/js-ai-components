# Utrecht Historical Monuments

> A React + TypeScript web app that displays Utrecht historical monuments on an ArcGIS web map with an AI assistant panel for natural-language exploration of the data.

## Features

- OAuth 2.0 redirect-based sign-in via ArcGIS `OAuthInfo` + `IdentityManager`
- Authenticated user menu in the navigation bar with avatar, full name, and username
- Sign Out — destroys credentials and redirects to the ArcGIS account sign-out page
- Switch Account — destroys credentials and reloads to trigger a fresh OAuth prompt
- ArcGIS web map loaded by item ID with zoom, compass, and collapsible legend widgets
- AI assistant panel with navigation, data-exploration, and help agents pre-configured for Utrecht monuments
- Suggested prompts seeded on sign-in to guide users into the data

## Components Used

| Component | Purpose |
|-----------|---------|
| `arcgis-map` | Renders the ArcGIS web map by item ID |
| `arcgis-zoom` | Zoom in/out widget (top-left) |
| `arcgis-compass` | Compass/north-arrow widget (bottom-right) |
| `arcgis-expand` | Collapsible container wrapping the legend (top-left) |
| `arcgis-legend` | Layer legend inside the expand widget |
| `arcgis-assistant` | AI assistant panel referencing the map element |
| `arcgis-assistant-navigation-agent` | Agent for navigating the map by voice/text |
| `arcgis-assistant-data-exploration-agent` | Agent for querying and exploring layer data |
| `arcgis-assistant-help-agent` | Agent for answering how-to questions |
| `calcite-shell` | Full-page app shell with header and panel slots |
| `calcite-navigation` | Top navigation bar with logo and user slots |
| `calcite-navigation-logo` | App title and icon in the nav bar |
| `calcite-navigation-user` | Clickable user chip in the nav bar (triggers popover) |
| `calcite-shell-panel` | Side panel slot housing the assistant |
| `calcite-popover` | User menu popover anchored to the nav-bar user chip |
| `calcite-avatar` | User avatar displayed inside the popover |
| `calcite-button` | Switch Account and Sign Out actions |

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A registered OAuth application at [developers.arcgis.com](https://developers.arcgis.com) (or your own portal)
- An ArcGIS web map item ID

### Environment Setup

Create a `.env` file in the project root:

```bash
VITE_ARCGIS_CLIENT_ID=your_oauth_app_id
VITE_PORTAL_URL=https://www.arcgis.com
VITE_MAP_ITEM_ID=your_webmap_item_id
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_ARCGIS_CLIENT_ID` | Yes | OAuth client ID registered for this app |
| `VITE_PORTAL_URL` | No | Portal base URL; defaults to `https://www.arcgis.com` |
| `VITE_MAP_ITEM_ID` | Yes | ArcGIS Online or Enterprise web map item ID |

### Run Locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173

### Build for Production

```bash
npm run build    # TypeScript check + Vite build
npm run preview  # Preview the production bundle locally
```

## Authentication

The app uses redirect-based OAuth (no popup). On load, `setupAuth()` in `src/auth.ts` registers an `OAuthInfo` with `popup: false`, then calls `esriId.checkSignInStatus()`. If no existing credential is found, it falls through to `esriId.getCredential()`, which redirects the browser to the ArcGIS sign-in page and back.

After sign-in, a `Portal` instance is loaded to retrieve the user's `fullName`, `username`, and `thumbnailUrl`.

**Sign Out** destroys all cached credentials and sends the browser to:
```
{PORTAL_URL}/home/pages/Account/manage_accounts.html#client_id=arcgisonline&signout=true
```

**Switch Account** destroys credentials and reloads the page, which re-runs the OAuth flow and prompts for a different account.

## Architecture

```
App.tsx
├── calcite-shell
│   ├── calcite-navigation (header slot)
│   │   ├── calcite-navigation-logo
│   │   └── UserMenu (user slot) → calcite-navigation-user + calcite-popover (portaled to <body>)
│   ├── MapView (default slot)
│   │   └── arcgis-map → arcgis-zoom, arcgis-compass, arcgis-expand > arcgis-legend
│   └── AssistantPanel (panel-end slot)
│       └── calcite-shell-panel > calcite-panel > arcgis-assistant
│           ├── arcgis-assistant-navigation-agent
│           ├── arcgis-assistant-data-exploration-agent
│           └── arcgis-assistant-help-agent
```

**User menu popover portal pattern** — `calcite-popover` is rendered via React's `createPortal` directly into `document.body`. This prevents Calcite's shadow DOM stacking context from clipping the popover when it is slotted deep inside `calcite-navigation`. The popover natively toggles on click of its `referenceElement`; no manual click handler is needed (adding one causes a double-toggle).

**AI assistant wiring** — `arcgis-assistant` uses `reference-element="#utrecht-monuments"` to bind to the map. Suggested prompts are set imperatively via `assistantRef.current.suggestedPrompts` after the user authenticates, ensuring the portal user context is available.

## Project Structure

```
src/
  auth.ts                  # OAuth setup, signOut(), switchAccount()
  hooks/
    useAuth.ts             # React hook wrapping async auth state
  components/
    UserMenu.tsx           # Nav bar user chip + portaled calcite-popover
    MapView.tsx            # arcgis-map with zoom, compass, expand+legend
    AssistantPanel.tsx     # arcgis-assistant panel with three agents
  App.tsx                  # calcite-shell + calcite-navigation app shell
  main.tsx                 # React entry point
  style.css                # Global styles and user menu layout
```

## Agent Team

| Agent | Role |
|-------|------|
| ArcGIS Calcite | UI component development |
| Testing | Validation and quality assurance |
| Docs | Documentation maintenance |
| GitHub Manager | Git workflow and code review |
| Feature Orchestrator | Coordinates full feature pipeline |
