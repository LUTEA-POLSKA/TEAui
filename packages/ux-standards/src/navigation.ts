/**
 * TEA UI — navigation and information architecture standards.
 *
 * Navigation is the one thing a user has to learn before they can do anything
 * else, so it is the thing that must be identical everywhere. The rule below
 * is the whole standard: *the same information architecture problem gets the
 * same navigation mechanism, in every TEA product.*
 */

export const NAVIGATION_MECHANISMS = [
  "sidebar",
  "tabs",
  "breadcrumb",
  "back",
  "command-palette",
  "global-search",
  "local-search",
  "contextual-nav",
  "stepper",
] as const;

export type NavigationMechanism = (typeof NAVIGATION_MECHANISMS)[number];

/**
 * Which mechanism answers which question. This is a decision table, not
 * advice: given the situation, the mechanism is already chosen.
 */
export interface NavigationRule {
  readonly situation: string;
  readonly use: NavigationMechanism;
  readonly avoid: string;
  readonly rationale: string;
}

export const NAVIGATION_RULES: readonly NavigationRule[] = [
  {
    situation: "A product has 5 or more top-level areas a user moves between constantly",
    use: "sidebar",
    avoid: "a horizontal menu bar",
    rationale:
      "A horizontal bar cannot hold labels that stay readable at this count. Both source projects converged on a 256px left sidebar; that is the ecosystem default.",
  },
  {
    situation: "A page has 2–7 peer views of the SAME subject",
    use: "tabs",
    avoid: "a sidebar entry per view",
    rationale:
      "Tabs keep siblings visible. Promoting peers to sidebar entries multiplies the top level and destroys the grouping the tabs were expressing.",
  },
  {
    situation: "A user is 3+ levels deep in a hierarchy",
    use: "breadcrumb",
    avoid: "back-button-only",
    rationale: "A breadcrumb shows where you are; back only shows where you were. Both, never either alone.",
  },
  {
    situation: "The product has 15+ actions or destinations, or a power-user workflow",
    use: "command-palette",
    avoid: "a settings page with 200 rows",
    rationale: "A palette is searchable and keyboard-first, which is what a high action count actually requires.",
  },
  {
    situation: "The list or table on screen is long enough to need filtering",
    use: "local-search",
    avoid: "a dialog with the same data",
    rationale: "Search belongs next to the thing it filters, so the relationship is obvious.",
  },
  {
    situation: "A destructive or hard-to-reverse multi-step task",
    use: "stepper",
    avoid: "a scrollable single page",
    rationale: "A stepper makes progress, remaining work and recoverability all visible at once.",
  },
  {
    situation: "Viewport is below 1024px",
    use: "back",
    avoid: "a shrunken sidebar",
    rationale:
      "Below `lg` a sidebar stops being information and becomes an obstruction; it collapses into a drawer. Both source projects already collapse at exactly this point.",
  },
];

export interface InformationArchitecture {
  /** Maximum top-level entries before the IA needs rethinking. */
  readonly maxTopLevel: number;
  /** Maximum entries in one navigation group before it needs a subgroup. */
  readonly maxGroupSize: number;
  /** Maximum tabs before they need to become a different mechanism. */
  readonly maxTabs: number;
}

export const IA_LIMITS: InformationArchitecture = {
  maxTopLevel: 7,
  maxGroupSize: 6,
  maxTabs: 7,
};

/**
 * URL/UI state synchronisation. State that the URL can express belongs in the
 * URL, so the view is linkable, reloadable and back-navigable.
 */
export const URL_SYNC = {
  /** Tabs, filters, pagination, sort order, selection, open panels. */
  inUrl: ["tab", "filter", "page", "sort", "selection", "panel"] as const,
  /** Never in the URL: transient state that would make a shared link confusing. */
  notInUrl: ["hover", "focus", "tooltip", "toast", "skeleton", "popover"] as const,
} as const;
