import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import '@gracious.tech/fetch-client/client.css';
import { FontSizeProvider } from "./state/FontSizeContext";
import { NuqsAdapter } from 'nuqs/adapters/react';

// Shoelace (icons)
import "@shoelace-style/shoelace/dist/themes/light.css";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js";
setBasePath(import.meta.env.BASE_URL + "shoelace/");

import AppShell from "./ui/AppShell";
import { ThemeProvider } from "./theme";

setBasePath("https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.15.1/dist/");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NuqsAdapter>
      <ThemeProvider>
        <FontSizeProvider>
          <AppShell />
        </FontSizeProvider>
      </ThemeProvider>
    </NuqsAdapter>
  </React.StrictMode>
);
