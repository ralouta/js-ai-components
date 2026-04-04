import { useAuth } from "./hooks/useAuth.js";
import { UserMenu } from "./components/UserMenu.js";
import { MapView } from "./components/MapView.js";
import { AssistantPanel } from "./components/AssistantPanel.js";

import "@esri/calcite-components/dist/components/calcite-shell";
import "@esri/calcite-components/dist/components/calcite-navigation";
import "@esri/calcite-components/dist/components/calcite-navigation-logo";
import "@esri/calcite-components/dist/components/calcite-action";

export default function App() {
  const { user, authError, signOut, switchAccount } = useAuth();

  if (authError) {
    return <div className="error">{authError}</div>;
  }

  return (
    <calcite-shell>
      <calcite-navigation slot="header">
        <calcite-navigation-logo
          heading="Utrecht Historical Monuments"
          icon="clustering"
          alt="Application logo"
          slot="logo"
        />
        <calcite-action
          id="nav-action"
          icon="hamburger"
          text="Dashboard Options"
          slot="navigation-action"
        />
        {user && <UserMenu slot="user" user={user} onSignOut={signOut} onSwitchAccount={switchAccount} />}
      </calcite-navigation>

      <MapView />
      <AssistantPanel user={user} />
    </calcite-shell>
  );
}
