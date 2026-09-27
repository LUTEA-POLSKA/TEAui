import * as React from "react";
import { THEMES } from "@tea-ui/tokens";
import { COPY, FEEDBACK, NAVIGATION_RULES, statusEntries } from "@tea-ui/ux-standards";
import {
  Alert,
  AlertTitle,
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Divider,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Heading,
  InlineCode,
  Input,
  List,
  Panel,
  Preformatted,
  Stack,
  StatusBadge,
  Text,
} from "@tea-ui/core";
import { AdminShell, StatTile, type NavItem } from "@tea-ui/admin";
import { Feature, FeatureGrid, Hero, PricingTable, Section } from "@tea-ui/public";

import type { DocPage } from "./registry";

/* -------------------------------------------------------------------------- */
/* Doc building blocks                                                         */
/* -------------------------------------------------------------------------- */

export function Doc({ children }: { children: React.ReactNode }): React.ReactElement {
  return <Stack gap="section">{children}</Stack>;
}

export function Lead({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <Text size="lead" tone="muted" className="max-w-2xl">
      {children}
    </Text>
  );
}

export function ApiTable({
  rows,
}: {
  rows: ReadonlyArray<[prop: string, type: string, required: boolean, note: string]>;
}): React.ReactElement {
  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full min-w-[40rem] border-collapse text-ui">
        <caption className="sr-only">API-Referenz</caption>
        <thead>
          <tr className="border-b border-line">
            {["Prop", "Typ", "Pflicht", "Bedeutung"].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="px-3 py-2 text-start text-label font-semibold uppercase tracking-widest text-fg-subtle"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([prop, type, required, note]) => (
            <tr key={prop} className="border-b border-line/50 last:border-b-0">
              <td className="px-3 py-2 align-top">
                <InlineCode>{prop}</InlineCode>
              </td>
              <td className="px-3 py-2 align-top text-fg-muted">
                <InlineCode>{type}</InlineCode>
              </td>
              <td className="px-3 py-2 align-top">
                {required ? <Badge tone="positive">ja</Badge> : <span className="text-fg-subtle">nein</span>}
              </td>
              <td className="px-3 py-2 align-top text-fg-muted">{note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A live example next to the code that produces it. */
export function Example({
  title,
  code,
  children,
}: {
  title: string;
  code: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Panel title={title} level={3}>
      <div className="mb-4">{children}</div>
      <Preformatted copyable maxHeight={280}>
        {code}
      </Preformatted>
    </Panel>
  );
}

function H2({ children }: { children: React.ReactNode }): React.ReactElement {
  return <Heading level={2}>{children}</Heading>;
}

/* -------------------------------------------------------------------------- */
/* Getting started                                                             */
/* -------------------------------------------------------------------------- */

const INSTALL = `npm install @tea-ui/core @tea-ui/tokens @tea-ui/ux-standards @tea-ui/utils
npm install @fontsource-variable/jost @fontsource-variable/jetbrains-mono @fontsource/lilita-one`;

const FIRST = `import { Button, Field, FieldError, FieldLabel, Input } from "@tea-ui/core";
import "@tea-ui/tokens/fonts.css";
import "@tea-ui/tokens/styles.css";

export function LoginForm() {
  return (
    <form>
      <Field required invalid={!!error}>
        <FieldLabel>E-Mail</FieldLabel>
        <Input type="email" autoComplete="email" />
        <FieldError>{error}</FieldError>
      </Field>
      <Button type="submit">Anmelden</Button>
    </form>
  );
}`;

function GettingStarted(): React.ReactElement {
  const [error, setError] = React.useState("");
  return (
    <Doc>
      <Heading level={1}>Erste Schritte</Heading>
      <Lead>
        TEA UI ist die gemeinsame UI- und UX-Plattform der TEA-Welt. Zwei
        Stylesheet-Importe, und du hast das gesamte System.
      </Lead>

      <H2>Installation</H2>
      <Preformatted copyable>{INSTALL}</Preformatted>

      <H2>Die erste Komponente</H2>
      <Lead>
        Beachte, was fehlt: kein <InlineCode>htmlFor</InlineCode>, kein{" "}
        <InlineCode>aria-describedby</InlineCode>, kein Farbwert. Das{" "}
        <InlineCode>Field</InlineCode> erzeugt die Verdrahtung. Deshalb ist die
        kurze Fassung hier auch die richtige.
      </Lead>
      <Example
        title="Live"
        code={FIRST}
      >
        <Stack gap="ui" className="max-w-sm">
          <Field required id="doc-email" invalid={error !== ""}>
            <FieldLabel>E-Mail</FieldLabel>
            <Input
              type="email"
              autoComplete="email"
              value={error ? "nicht-valide" : ""}
              onChange={(event) => setError(event.target.value)}
            />
            {error ? <FieldError>Bitte gib eine gültige Adresse an.</FieldError> : null}
          </Field>
          <Button onClick={() => setError("x")}>Anmelden</Button>
        </Stack>
      </Example>

      <H2>Das Theme setzen</H2>
      <Lead>
        Ein Theme weist Werte semantischen Rollen zu. Keine Komponente ändert
        sich zwischen Themes, und keine enthält eine Farbe.
      </Lead>
      <Preformatted copyable>{`<html data-theme="${THEMES[1]}" data-density="compact">`}</Preformatted>
    </Doc>
  );
}

/* -------------------------------------------------------------------------- */
/* Core                                                                        */
/* -------------------------------------------------------------------------- */

const BUTTON_API: Array<[string, string, boolean, string]> = [
  ["variant", "'primary' | 'secondary' | 'outline' | 'ghost' | 'subtle' | 'destructive' | 'link'", false, "Die einzige Stilachse neben `size`."],
  ["size", "'sm' | 'md' | 'lg' | 'icon-sm' | 'icon-md' | 'icon-lg'", false, "Höhe aus der Dichte, nicht aus einem festen Wert."],
  ["loading", "boolean", false, "Zeigt einen Spinner, hält die Breite, setzt `aria-busy` und blockiert eine Wiederholung."],
  ["asChild", "boolean", false, "Rendert das Kindelement statt eines `<button>` — für Router-Links."],
  ["disabled", "boolean", false, "Der native Zustand."],
];

function CorePage(): React.ReactElement {
  const [value, setValue] = React.useState("srv-01");
  return (
    <Doc>
      <Heading level={1}>Core</Heading>
      <Lead>
        Der produktabhängigkeitsfreie Layer. Hier steht nichts davon, was ein
        Server, ein Backup oder ein Nutzer ist.
      </Lead>

      <H2>Button</H2>
      <Example
        title="Varianten und Zustände"
        code={`<Button variant="destructive" loading>Sichern</Button>
<Button asChild><Link href="/docs">Dokumentation</Link></Button>`}
      >
        <Stack gap="ui">
          <ButtonGroup label="Varianten">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </ButtonGroup>
          <ButtonGroup label="Zustände">
            <Button loading>Sichern</Button>
            <Button disabled>Deaktiviert</Button>
          </ButtonGroup>
        </Stack>
      </Example>
      <ApiTable rows={BUTTON_API} />

      <H2>Field</H2>
      <Lead>
        Das wichtigste Bauteil der Bibliothek. Es verdrahtet Label, Beschreibung
        und Fehlermeldung strukturell — deshalb kann ein Feld ohne zugänglichen
        Namen nicht entstehen.
      </Lead>
      <Example
        title="Live"
        code={`<Field required invalid={!!error}>
  <FieldLabel>E-Mail</FieldLabel>
  <Input type="email" autoComplete="email" />
  <FieldDescription>Wir senden keine Bestätigung.</FieldDescription>
  <FieldError>{error}</FieldError>
</Field>`}
      >
        <div className="max-w-sm">
          <Field required id="doc-field" invalid={value === ""}>
            <FieldLabel>Hostname</FieldLabel>
            <Input value={value} onChange={(event) => setValue(event.target.value)} />
            <FieldDescription>Kleinbuchstaben, Zahlen und Bindestriche.</FieldDescription>
            {value === "" ? <FieldError>Der Hostname darf nicht leer sein.</FieldError> : null}
          </Field>
        </div>
      </Example>

      <H2>Status</H2>
      <Lead>
        Ein Zustand wird immer über das Register gerendert. Nie mit einer eigenen
        Farbe, nie mit einem eigenen Wort.
      </Lead>
      <div className="grid gap-2 sm:grid-cols-2">
        {statusEntries("health").map(([key, meta]) => (
          <div key={key} className="flex items-center gap-3">
            <StatusBadge domain="health" status={key} />
            <InlineCode>health.{key}</InlineCode>
            <span className="text-micro text-fg-subtle">{meta.tone}</span>
          </div>
        ))}
      </div>

      <H2>Zustände</H2>
      <Lead>
        Jede asynchrone Fläche ist in genau einem von siebzehn benannten Zuständen.
        Der passende Indikator ist entschieden, nicht gewählt.
      </Lead>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(FEEDBACK).map(([name, meta]) => (
          <div key={name} className="border border-line p-2">
            <InlineCode>{name}</InlineCode>
            <div className="text-micro text-fg-muted">{meta.label}</div>
            <div className="text-label text-fg-subtle">
              {meta.kind} · {meta.blocking ? "blockierend" : "nicht blockierend"}
            </div>
          </div>
        ))}
      </div>
    </Doc>
  );
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                       */
/* -------------------------------------------------------------------------- */

const ADMIN_NAV: NavItem[] = [
  { id: "uebersicht", label: "Übersicht", group: "Allgemein" },
  { id: "server", label: "Server", group: "Allgemein" },
];

function AdminPage(): React.ReactElement {
  return (
    <Doc>
      <Heading level={1}>Admin</Heading>
      <Lead>
        Der informationsdichte Layer: optimiert für Scannen und
        Tastatur-Workflows. Alles compose Core, nichts kennt eine API.
      </Lead>

      <H2>Application Shell</H2>
      <Lead>
        Unter 1024px wird die Sidebar zum Drawer, und ein Skip-Link ist das erste
        fokussierbare Element. Beides war in beiden Quellprodukten nicht
        vorhanden.
      </Lead>
      <div className="overflow-hidden border border-line">
        <AdminShell
          product="TEA Demo"
          nav={ADMIN_NAV}
          activeId="uebersicht"
          actions={<Button size="sm" variant="outline">Aktion</Button>}
        >
          <div className="p-4">
            <Text size="ui">Hier steht der Seiteninhalt.</Text>
          </div>
        </AdminShell>
      </div>

      <H2>StatTile</H2>
      <Lead>
        Der Wert ist das Thema, also führt er und ist die größte Schriftgröße.
        Farbe ist ein <InlineCode>tone</InlineCode> und nie das einzige Signal.
      </Lead>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Server online" value="12" tone="positive" trend="up" trendValue="+2" />
        <StatTile label="CPU-Last" value="47 %" tone="info" trend="down" trendValue="−6 %" />
        <StatTile label="Speicher" value="412 GiB" tone="caution" hint="von 1 TiB" />
      </div>
    </Doc>
  );
}

/* -------------------------------------------------------------------------- */
/* Public                                                                      */
/* -------------------------------------------------------------------------- */

function PublicPage(): React.ReactElement {
  return (
    <Doc>
      <Heading level={1}>Public</Heading>
      <Lead>
        Public UI ist kein Admin UI in anderen Farben. Der Unterschied ist
        strukturell: Textmaß, Schriftgröße, Rhythmus und Conversion.
      </Lead>

      <div className="overflow-hidden border border-line">
        <Section spacing="normal">
          <Hero
            eyebrow="Beispiel"
            title="Eine Headline, die man in fünf Sekunden versteht"
            lead="Der Fließtext läuft bis maximal drei Spalten Breite. Eine 120-Zeichen-Zeile ist nicht lesbar — und Marketing-Seiten sind Leseseiten."
            actions={
              <>
                <Button>Jetzt starten</Button>
                <Button variant="outline">Dokumentation</Button>
              </>
            }
          />
          <Section bordered>
            <FeatureGrid>
              <Feature title="Schnell" description="Kein Setup, keine Konfiguration." proof="Start in 30 Sekunden" />
              <Feature title="Klar" description="Eine Struktur, die man einmal lernt." proof="Ein Navigationsmodell" />
              <Feature title="Barrierefrei" description="WCAG 2.2 AA, geprüft im Build." proof="64 Kontrastmessungen" />
            </FeatureGrid>
          </Section>
        </Section>
      </div>

      <H2>Preise</H2>
      <PricingTable
        tiers={[
          { name: "Basis", price: "0 €", period: "für immer", features: ["1 Projekt", "Community-Support"], action: <Button variant="outline" size="sm">Auswählen</Button> },
          { name: "Team", price: "29 €", period: "pro Monat", description: "Für kleine Teams.", features: ["Unbegrenzte Projekte", "Prioritäts-Support"], highlighted: true, action: <Button size="sm">Auswählen</Button> },
          { name: "Firma", price: "Auf Anfrage", features: ["SLA", "Eigene Instanz"], action: <Button variant="ghost" size="sm">Kontakt</Button> },
        ]}
      />
    </Doc>
  );
}

/* -------------------------------------------------------------------------- */
/* UX Standards                                                                */
/* -------------------------------------------------------------------------- */

function UxPage(): React.ReactElement {
  return (
    <Doc>
      <Heading level={1}>UX Standards</Heading>
      <Lead>
        Standards, die niemand liest, sind keine. Deshalb liegen sie als Code
        vor: eine Status-Vokabel, eine Destruktivitäts-Matrix, ein
        Formularverhalten — und eine Komponente kann sie nicht versehentlich
        umgehen.
      </Lead>

      <H2>Cross-Product Consistency</H2>
      <Alert tone="info">
        <AlertTitle>Die eine Regel</AlertTitle>
        Wenn zwei TEA-Produkte dasselbe Interaktionsproblem lösen, verhalten sie sich
        gleich — außer es gibt einen dokumentierten Grund.
      </Alert>

      <H2>Navigation</H2>
      <Lead>Die Frage entscheidet das Muster. Diese Tabelle ist die Entscheidung.</Lead>
      <div className="flex flex-col gap-3">
        {NAVIGATION_RULES.map((rule) => (
          <Card key={rule.situation}>
            <CardHeader>
              <CardTitle level={4}>{rule.use}</CardTitle>
            </CardHeader>
            <CardBody>
              <Text size="ui">{rule.situation}</Text>
              <Text size="micro" tone="muted" className="mt-1">
                <strong className="text-fg">Nicht:</strong> {rule.avoid} — {rule.rationale}
              </Text>
            </CardBody>
          </Card>
        ))}
      </div>

      <H2>Destruktive Aktionen</H2>
      <Lead>
        Der schwächste Schutz, der für die Konsequenz ausreicht. Jedes unnötige
        Bestätigungsdialog ist ein Dialog, den der User künftig wegklickt — auch
        den, den er lesen müsste.
      </Lead>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["reversible", "Undo", "Nichts fragen. Rückgängig anbieten."],
          ["recoverable", "Bestätigen", "Folge benennen. Abbrechen ist der Fokus."],
          ["irreversible", "Bestätigen + tippen", "Folge benennen. Name tippen lassen."],
        ].map(([level, protection, note]) => (
          <Card key={level}>
            <CardBody>
              <InlineCode>{level}</InlineCode>
              <div className="mt-1 text-ui text-fg">{protection}</div>
              <Text size="micro" tone="muted" className="mt-1">
                {note}
              </Text>
            </CardBody>
          </Card>
        ))}
      </div>
      <Alert tone="caution">
        <AlertTitle>Nie destruktiv als Primärbutton</AlertTitle>
        In beiden Quellprodukten war Zerstörung die auffälligste Aktion einer Zeile.
        Der Widerstand muss beim destruktiven Pfad liegen, nicht beim reversiblen.
      </Alert>
    </Doc>
  );
}

/* -------------------------------------------------------------------------- */
/* Architecture                                                                */
/* -------------------------------------------------------------------------- */

function ArchitecturePage(): React.ReactElement {
  return (
    <Doc>
      <Heading level={1}>Architektur</Heading>
      <Lead>
        Abhängigkeiten zeigen nur nach unten. Jede Kante wird in CI geprüft; ein
        Import nach oben ist ein Fehler, kein Stil.
      </Lead>

      <H2>Pakete</H2>
      <ApiTable
        rows={[
          ["@tea-ui/utils", "Paket", true, "Klassen zusammenführen, Varianten, Präfix."],
          ["@tea-ui/tokens", "Paket", true, "Rollen, Themes, Dichte, Bewegung, Breakpoints."],
          ["@tea-ui/ux-standards", "Paket", true, "Statusregister, Töne, Zustände, Terminologie."],
          ["@tea-ui/icons", "Paket", true, "Kuratierte Icon-Menge."],
          ["@tea-ui/core", "Paket", true, "Primitive, produktabhängigkeitsfrei."],
          ["@tea-ui/admin", "Paket", true, "Shell, Metriken, Datenzustände."],
          ["@tea-ui/public", "Paket", true, "Marketing, Website, Content, Conversion."],
        ]}
      />

      <H2>Warum genau ein Stylesheet</H2>
      <Lead>
        9,7 kB gzip für das gesamte System. Jedes Paket exportiert dieselbe Datei
        als <InlineCode>&lt;pkg&gt;/styles.css</InlineCode>, also importiert ein
        Produkt sie genau einmal, und keine Komponente kann CSS ausliefern, das
        vom System abweicht.
      </Lead>

      <H2>Tree-Shaking, gemessen</H2>
      <Lead>
        Nicht behauptet, sondern gemessen — mit <InlineCode>npm run check:tree</InlineCode>.
        Eine einzelne Komponente kostet 13,2 % des Pakets. Vor dieser
        Entscheidung waren es 93,4 %, weil das Bundling die
        <InlineCode>createContext()</InlineCode>-Aufrufe aller Komponenten in
        eine Ebene gezogen hatte.
      </Lead>

      <H2>Versionierung</H2>
      <List>
        <li>Öffentliche APIs sind Verträge. Ein Bruch braucht eine Major-Version, eine Migrationsnotiz und einen Changelog-Eintrag.</li>
        <li>Jede Änderung bekommt einen Changeset mit Begründung.</li>
        <li>Der Release entsteht aus einem gemergten Changeset, nie aus einem manuellen Schritt.</li>
      </List>
      <Divider className="my-2" />
      <Text size="micro" tone="muted">
        Der vollständige Audit, aus dem diese Regeln stammen, liegt unter{" "}
        <InlineCode>docs/audit/</InlineCode>.
      </Text>
    </Doc>
  );
}

/* -------------------------------------------------------------------------- */
/* The registry                                                                */
/* -------------------------------------------------------------------------- */

export const DOC_PAGES: readonly DocPage[] = [
  {
    id: "getting-started",
    title: "Erste Schritte",
    group: "start",
    summary: "Installation, Setup, die erste Komponente, das erste Theme.",
    keywords: ["install", "setup", "npm", "import", "theme", "getting started"],
    render: () => <GettingStarted />,
  },
  {
    id: "core",
    title: "Core",
    group: "core",
    summary: "Primitives: Layout, Typografie, Eingaben, Feedback, Overlays, Navigation.",
    keywords: ["button", "field", "input", "select", "combobox", "dialog", "tabs", "status", "card", "skeleton", "toast", "layout", "typography"],
    render: () => <CorePage />,
  },
  {
    id: "admin",
    title: "Admin",
    group: "admin",
    summary: "Shell, Metriken und Produktzustände für informationsdichte Werkzeuge.",
    keywords: ["admin", "shell", "sidebar", "table", "stat", "metric", "empty", "error", "loading", "dashboard"],
    render: () => <AdminPage />,
  },
  {
    id: "public",
    title: "Public",
    group: "public",
    summary: "Marketing, Website-Chrome, Content und Conversion.",
    keywords: ["public", "marketing", "hero", "pricing", "faq", "footer", "navbar", "conversion", "landing"],
    render: () => <PublicPage />,
  },
  {
    id: "ux-standards",
    title: "UX Standards",
    group: "ux",
    summary: "Interaktion, Zustände, Fehler, Formulare, Navigation, Bewegung.",
    keywords: ["ux", "standards", "interaction", "feedback", "error", "forms", "navigation", "motion", "empty", "destructive"],
    render: () => <UxPage />,
  },
  {
    id: "architecture",
    title: "Architektur",
    group: "architecture",
    summary: "Pakete, Tokens, Bundle, Versionierung, Release.",
    keywords: ["architecture", "packages", "tokens", "tree-shaking", "bundle", "versioning", "changesets", "ci"],
    render: () => <ArchitecturePage />,
  },
];

export { COPY };
