import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// The published import paths, exactly as a TEA product writes them.
import "@tea-ui/tokens/fonts.css";
import "@tea-ui/tokens/styles.css";
import "./app.css";
import { App } from "./app";

const container = document.getElementById("root");
if (!container) throw new Error("#root is missing from index.html");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
