import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import '@gracious.tech/fetch-client/client.css';
import { FontSizeProvider } from "./state/FontSizeContext";

// Shoelace (icons)
import "@shoelace-style/shoelace/dist/themes/light.css";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";


import AppShell from "./ui/AppShell";
import { ThemeProvider } from "./theme";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <FontSizeProvider>
        <AppShell />
      </FontSizeProvider>
    </ThemeProvider>
  </React.StrictMode>
);
