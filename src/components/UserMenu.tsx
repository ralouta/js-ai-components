import { createPortal } from "react-dom";
import type { AuthUser } from "../auth.js";

import "@esri/calcite-components/dist/components/calcite-navigation-user";
import "@esri/calcite-components/dist/components/calcite-popover";
import "@esri/calcite-components/dist/components/calcite-avatar";
import "@esri/calcite-components/dist/components/calcite-button";

interface Props {
  slot?: string;
  user: AuthUser;
  onSignOut: () => void;
}

// calcite-popover natively toggles when its referenceElement is clicked.
// No manual click handler needed — adding one causes a double-toggle (open then close).
export function UserMenu({ slot, user, onSignOut }: Props) {
  return (
    <>
      <calcite-navigation-user
        slot={slot}
        id="header-user-btn"
        full-name={user.fullName}
        username={user.username}
        thumbnail={user.thumbnailUrl ?? ""}
      />
      {createPortal(
        <calcite-popover
          id="user-menu-popover"
          label="User menu"
          referenceElement="header-user-btn"
          placement="bottom-end"
          autoClose
        >
          <div className="user-menu-content">
            <div className="user-menu-identity">
              <calcite-avatar
                full-name={user.fullName}
                thumbnail={user.thumbnailUrl ?? ""}
                scale="l"
              />
              <div>
                <p className="user-menu-name">{user.fullName}</p>
                <p className="user-menu-username">{user.username}</p>
              </div>
            </div>
            <div className="user-menu-actions">
              <calcite-button
                appearance="outline"
                width="full"
                icon-start="sign-out"
                onClick={onSignOut}
              >
                Sign Out
              </calcite-button>
            </div>
          </div>
        </calcite-popover>,
        document.body
      )}
    </>
  );
}
