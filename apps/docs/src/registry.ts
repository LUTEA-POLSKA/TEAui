import * as React from "react";

/**
 * TEA UI — the documentation registry.
 *
 * The index is built from the same data the pages render from, so search cannot
 * drift from the content: there is one entry per page, and adding a page without
 * describing it is a visible omission in the navigation rather than an
 * undiscoverable orphan.
 *
 * Search is client-side and prefix-based. At this size a fuzzy index would be a
 * dependency bought for a problem that does not exist, and a search box that
 * returns nothing is worse than no search box.
 */

export interface DocPage {
  /** URL segment. */
  id: string;
  /** Sidebar label. */
  title: string;
  /** Group heading in the sidebar. */
  group: string;
  /** One-line summary, also used in search. */
  summary: string;
  /** Extra search terms: component names, keywords, package names. */
  keywords: readonly string[];
  /** Rendered page. */
  render: () => React.ReactNode;
}

export interface DocGroup {
  id: string;
  label: string;
  description: string;
}

export const DOC_GROUPS: readonly DocGroup[] = [
  { id: "start", label: "Erste Schritte", description: "Installation und die erste Komponente" },
  { id: "core", label: "Core", description: "Primitives: Layout, Typografie, Eingaben, Overlays" },
  { id: "admin", label: "Admin", description: "Informationsdichte: Shell, Metriken, Zustände" },
  { id: "public", label: "Public", description: "Marketing, Website, Content, Conversion" },
  { id: "ux", label: "UX Standards", description: "Die Regeln, nach denen die Komponenten gebaut sind" },
  { id: "architecture", label: "Architektur", description: "Pakete, Tokens, Release, Performance" },
];

export { DOC_PAGES } from "./pages";
