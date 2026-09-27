import * as React from "react";

import { DOC_GROUPS, DOC_PAGES } from "./registry";
import { DocsShell } from "./shell";

/**
 * TEA UI Documentation.
 *
 * Eleven lines of hash routing instead of a router dependency, for the same
 * reason the Showcase has them: a dozen routes in a static bundle do not need a
 * framework, and one fewer dependency is one fewer thing to audit.
 */
function useHashRoute(fallback: string): string {
  const read = React.useCallback(
    () => globalThis.location?.hash.replace(/^#\/?/, "") || fallback,
    [fallback],
  );
  const [route, setRoute] = React.useState(read);

  React.useEffect(() => {
    const onChange = () => setRoute(read());
    globalThis.addEventListener("hashchange", onChange);
    return () => globalThis.removeEventListener("hashchange", onChange);
  }, [read]);

  return route;
}

export function App(): React.ReactElement {
  const route = useHashRoute("getting-started");
  const go = React.useCallback((id: string) => {
    globalThis.location.hash = `#/${id}`;
  }, []);

  return <DocsShell pages={DOC_PAGES} groups={DOC_GROUPS} route={route} onNavigate={go} />;
}
