import "@arcgis/core/assets/esri/themes/light/main.css";
import "@esri/calcite-components/main.css";
import "./style.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.js";
import { completePopupAuth } from "./auth.js";

const root = document.getElementById("root");
if (!root) throw new Error("No #root element found in index.html");

const searchParams = new URLSearchParams(window.location.search);

if (searchParams.get("auth") === "popup") {
	root.textContent = "Completing sign-in...";
	void completePopupAuth().catch((error: unknown) => {
		root.textContent = error instanceof Error ? error.message : "Sign-in failed.";
	});
} else {
	createRoot(root).render(
		<StrictMode>
			<App />
		</StrictMode>
	);
}
