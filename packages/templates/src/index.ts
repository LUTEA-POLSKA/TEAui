/**
 * TEA UI Templates — scope registry.
 *
 * A template is a **complete page structure**: the arrangement of a shell, a
 * header, content regions and actions for one kind of page, with the state
 * handling already decided.
 *
 * The difference to a pattern is scope. A pattern solves an interaction and
 * appears anywhere; a template solves a *page* and is the starting point for
 * exactly one kind of screen. Neither contains business logic — the template
 * takes the data and the callbacks, the product supplies the meaning.
 *
 * What a template is for is avoidance. The audit found the same page frame
 * rebuilt in every project: a sidebar, a top bar, a title, a content area, a
 * right rail, and the same three questions about where each of them goes.
 */
export interface TemplateMeta {
  readonly id: string;
  /** The screen this template is for. */
  readonly purpose: string;
  /** The regions it composes, in reading order. */
  readonly regions: readonly string[];
  /** Which states it handles for you. */
  readonly states: readonly string[];
  /** What it deliberately does not do. */
  readonly excludes: readonly string[];
}

export const TEMPLATES: readonly TemplateMeta[] = [
  {
    id: "DashboardTemplate",
    purpose: "Eine Übersicht, die auf einen Blick den Zustand mehrerer Dinge zeigt.",
    regions: ["PageHeader", "StatGrid", "Panel-Reihe", "Aktivitätsliste"],
    states: ["loading", "error", "stale", "empty"],
    excludes: ["Navigation", "Routing", "welche Metrik wann wichtig ist"],
  },
  {
    id: "SettingsTemplate",
    purpose: "Eine Einstellungsseite mit Abschnitten und Speichern.",
    regions: ["PageHeader", "Section-Navigation", "SettingsPanel", "SaveBar"],
    states: ["idle", "saving", "success", "error", "stale"],
    excludes: ["Persistenz", "Berechtigungen", "welche Einstellungen es gibt"],
  },
  {
    id: "ResourceTemplate",
    purpose: "Eine CRUD-Seite für eine Ressource.",
    regions: ["PageHeader", "FilterBar", "Tabelle", "Pagination", "ActionBar"],
    states: ["loading", "refreshing", "empty", "error"],
    excludes: ["Spalten", "Validierung", "was die Aktionen tun"],
  },
  {
    id: "MonitoringTemplate",
    purpose: "Eine technische Übersicht mit Verlauf und Alarmen.",
    regions: ["PageHeader", "Statusleiste", "Zeitreihe", "Alarmliste", "Ereignisliste"],
    states: ["loading", "refreshing", "stale", "offline", "error"],
    excludes: ["Schwellenwerte", "was ein Alarm bedeutet"],
  },
  {
    id: "LogsTemplate",
    purpose: "Eine Logansicht mit Filtern, Live-Tail und Zeitbereich.",
    regions: ["PageHeader", "FilterBar", "VirtualList", "DetailDrawer"],
    states: ["loading", "streaming", "empty", "error"],
    excludes: ["Logformat", "Paginierung im Backend"],
  },
  {
    id: "LandingPageTemplate",
    purpose: "Eine öffentliche Startseite.",
    regions: ["PublicNavbar", "Hero", "FeatureGrid", "SocialProof", "Pricing", "CTA", "PublicFooter"],
    states: ["normal"],
    excludes: ["Texte", "Screenshots", "SEO-Texte"],
  },
  {
    id: "AuthTemplate",
    purpose: "Anmeldung, Registrierung und Passwort-Zurücksetzung.",
    regions: ["AuthShell", "Form", "Weiterer Zugang", "Rechtliches"],
    states: ["idle", "submitting", "error", "success"],
    excludes: ["Authentifizierung", "Weiterleitung", "Fehlertexte des Backends"],
  },
  {
    id: "DocumentationTemplate",
    purpose: "Eine Dokumentationsseite mit Navigation, Suche und Inhalt.",
    regions: ["DocsHeader", "Sidebar", "Content", "PrevNext", "Footer"],
    states: ["normal"],
    excludes: ["Inhalt", "Suche", "Versionierung"],
  },
] as const;

export function templateMeta(id: string): TemplateMeta | undefined {
  return TEMPLATES.find((template) => template.id === id);
}

export type TemplateId = (typeof TEMPLATES)[number]["id"];
