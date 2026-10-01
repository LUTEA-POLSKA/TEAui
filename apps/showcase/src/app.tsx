import * as React from "react";
import { Container, Toaster, TooltipProvider } from "@tea-ui/core";
import { COPY } from "@tea-ui/ux-standards";

import { ShowcaseFooter, ShowcaseHeader, useHashRoute } from "./chrome";
import { DisplayProvider, ThemeControls } from "./display";
import { GallerySection } from "./gallery";
import {
  AccessibilitySection,
  AdminSection,
  ArchitectureSection,
  HomeSection,
  PatternsSection,
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
    <div className="bg-canvas text-fg">
      <ShowcaseHeader route={route} onNavigate={go} />

      <main id="tea-showcase-main" tabIndex={-1} className="focus-visible:outline-none">
        {route === "gallery" ? <GallerySection /> : null}
        {route === "themes" ? <ThemesSection /> : null}
        {route === "admin" ? <AdminSection /> : null}
      {route === "patterns" ? <PatternsSection /> : null}
        {route === "ux" ? <UxSection /> : null}
        {route === "accessibility" ? <AccessibilitySection /> : null}
        {route === "playground" ? <PlaygroundSection /> : null}
        {route === "architecture" ? <ArchitectureSection /> : null}
        {route === "home" ? <HomeSection /> : null}
      </main>

      <ShowcaseFooter />

      {/* The toast layer is mounted once, at the root. It is an application
          responsibility, not a component responsibility — a library that
          rendered its own overlay host could not be mounted twice. */}
      <Toaster />
    </div>
  );
}

export function App(): React.ReactElement {
  return (
    <DisplayProvider>
      {/* The provider has to be *above* the content, not beside it. It used to
          sit at the end of the tree wrapping a single `sr-only` span, which
          left every `Tooltip` in the Showcase outside its context — the page
          rendered, then threw on the first tooltip. Wrapping the whole app is
          what "mounted once, at the root" has to mean. */}
      <TooltipProvider delayDuration={300}>
        <span className="sr-only">{COPY.navigation.main}</span>
        <Showcase />
      </TooltipProvider>
    </DisplayProvider>
  );
}

export { ThemeControls };
export type { Container };
