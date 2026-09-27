import * as React from "react";
import { Container, Toaster, TooltipProvider } from "@tea-ui/core";
import { COPY } from "@tea-ui/ux-standards";

import { ShowcaseFooter, ShowcaseHeader, useHashRoute } from "./chrome";
import { DisplayProvider, ThemeControls } from "./display";
import {
  AccessibilitySection,
  AdminSection,
  ArchitectureSection,
  ComponentsSection,
  HomeSection,
  PlaygroundSection,
  ThemesSection,
  UxSection,
} from "./sections";

/**
 * TEA UI Showcase.
 *
 * Everything rendered here is the real system: the same components a TEA
 * product imports, the same tokens, the same UX Standards. There is deliberately
 * no showcase-only implementation of anything — a mockup proves nothing about
 * the library, and the audit's most expensive finding was that the two source
 * products each carried their own private copy of the UI they were supposed to
 * be sharing.
 */
function Showcase(): React.ReactElement {
  const route = useHashRoute("home");

  const go = React.useCallback((id: string) => {
    globalThis.location.hash = `#/${id}`;
  }, []);

  return (
    <div className="showcase-scroll bg-canvas text-fg">
      <ShowcaseHeader route={route} onNavigate={go} />

      <main id="tea-showcase-main" tabIndex={-1} className="focus-visible:outline-none">
        {route === "components" ? <ComponentsSection /> : null}
        {route === "themes" ? <ThemesSection /> : null}
        {route === "admin" ? <AdminSection /> : null}
        {route === "ux" ? <UxSection /> : null}
        {route === "accessibility" ? <AccessibilitySection /> : null}
        {route === "playground" ? <PlaygroundSection /> : null}
        {route === "architecture" ? <ArchitectureSection /> : null}
        {route === "home" ? <HomeSection /> : null}
      </main>

      <ShowcaseFooter />

      {/* The toast layer and the tooltip provider are mounted once, at the root.
          Both are application responsibilities, not component responsibilities —
          a library that rendered its own overlay host could not be mounted twice. */}
      <Toaster />
      <TooltipProvider delayDuration={300}>
        <span className="sr-only">{COPY.navigation.main}</span>
      </TooltipProvider>
    </div>
  );
}

export function App(): React.ReactElement {
  return (
    <DisplayProvider>
      <Showcase />
    </DisplayProvider>
  );
}

export { ThemeControls };
export type { Container };
