import * as React from "react";
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Server,
  ShieldCheck,
} from "@tea-ui/icons";
import { THEMES } from "@tea-ui/tokens";
import { FEEDBACK, NAVIGATION_RULES } from "@tea-ui/ux-standards";
import {
  Alert,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  Callout,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Checkbox,
  Combobox,
  Divider,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Heading,
  IconButton,
  InlineCode,
  Kbd,
  List,
  Panel,
  Progress,
  Radio,
  RadioGroup,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Slider,
  Stack,
  StatusBadge,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Textarea,
  Toggle,
  ToggleGroup,
  formatBytes,
  formatDuration,
  toast,
} from "@tea-ui/core";
import {
  AdminShell,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  RefreshingIndicator,
  StatGrid,
  StatTile,
  type NavItem,
} from "@tea-ui/admin";

import { Demo, Row, Section } from "./chrome";

/* ========================================================================== */
/* Home                                                                        */
/* ========================================================================== */

export function HomeSection(): React.ReactElement {
  return (
    <>
      <Section
        eyebrow="Die gemeinsame Basis"
        title="Build once. Generalize properly. Reuse everywhere."
        lead="TEA UI ist die UI-, UX- und Designsystem-Plattform der TEA-Welt. Jedes neue Produkt setzt auf denselben Komponenten, Mustern und Regeln auf — statt sie zum dritten Mal zu erfinden."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Eine Codebasis",
              body: "Komponenten, Muster, Templates, Blueprints und UX Standards liegen an einer Stelle. Ein Fehler wird einmal behoben.",
            },
            {
              title: "Ein Verhalten",
              body: "Wenn zwei TEA-Produkte dasselbe Interaktionsproblem lösen, verhalten sie sich gleich — außer es gibt einen dokumentierten Grund.",
            },
            {
              title: "Ein Maßstab",
              body: "WCAG 2.2 AA, ein Typografie-Maßstab, eine Typografie- und Farbrolle. Keine Produkt-Ausnahmen.",
            },
          ].map((entry) => (
            <Card key={entry.title}>
              <CardBody>
                <CardTitle level={3}>{entry.title}</CardTitle>
                <Text size="micro" tone="muted" className="mt-2">
                  {entry.body}
                </Text>
              </CardBody>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Der Ausgangspunkt"
        title="Nicht erfunden. Auditiert."
        lead="HomeServerManager und LUTEA Design wurden vollständig gelesen, bevor hier eine Zeile entstanden ist. Jede Entscheidung in TEA UI beantwortet einen konkreten Befund aus diesen beiden Codebasen."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Befunde, die die Architektur geprägt haben" level={2}>
            <List className="mt-1">
              <li>20 handgeschriebene Kopien derselben Kartenfläche, mit p-3 bis p-8.</li>
              <li>8 identische „Lade …"-Loader — plus ein gebautes, ungenutztes Skeleton.</li>
              <li>9 Fehlerbanner, von denen 2 ein role="alert" hatten.</li>
              <li>5 Stat-Tile-Funktionen, davon 2 gleichnamig mit anderen Props.</li>
              <li>Null prefers-reduced-motion in beiden Projekten.</li>
              <li>Realer Text in 9px und 10px.</li>
              <li>4 von 5 Formularfeldern ohne verknüpftes label.</li>
            </List>
          </Panel>
          <Panel title="Was daraus wurde" level={2}>
            <List className="mt-1">
              <li>Eine Kartenfläche mit genau einer Antwort auf „wie viel Padding".</li>
              <li>Ein Zustandsregister, geschlüsselt nach Wire-Value statt nach Farbe.</li>
              <li>Ein Formularsystem, in dem ein un关联 label nicht vorkommen kann.</li>
              <li>Ein Dichte-Attribut, das jedes Control rekursiv neu einstellt.</li>
              <li>Eine CSS-Basis, in der Rot-300, 9px und rounded-md nicht kompilieren.</li>
            </List>
            <Callout tone="info" title="Nachvollziehbar" className="mt-4">
              Die vollständigen Audits liegen unter <InlineCode>docs/audit/</InlineCode> — je Projekt
              sowie die Zusammenführung mit allen offenen Architektur-Entscheidungen.
            </Callout>
          </Panel>
        </div>
      </Section>
    </>
  );
}

/* ========================================================================== */
/* Components                                                                  */
/* ========================================================================== */

export function ComponentsSection(): React.ReactElement {
  return (
    <>
      <Section
        eyebrow="Core"
        title="Der Core-Layer, live"
        lead="Alles hier ist die echte Implementierung — dieselbe, die ein Produkt importiert. Keine Mockups, keine Screenshots."
      >
        <div className="grid gap-8">
          <Demo title="Buttons" description="Acht Varianten, drei Dichten, echtes Verhalten.">
            <Stack gap="section">
              <Row label="Variant">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="subtle">Subtle</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </Row>
              <Row label="Zustand">
                <Button loading>Sichern</Button>
                <Button disabled>Deaktiviert</Button>
                <IconButton label="Einstellungen öffnen" variant="outline">
                  <span aria-hidden="true">⚙</span>
                </IconButton>
              </Row>
              <Row label="Gruppe">
                <ButtonGroup label="Git-Aktionen">
                  <Button variant="outline">Tag</Button>
                  <Button variant="outline">Zweig</Button>
                  <Button variant="outline">Commit</Button>
                </ButtonGroup>
              </Row>
            </Stack>
          </Demo>

          <Demo title="Eingaben" description="Jedes Feld ist über die Tastatur bedienbar und hat einen zugänglichen Namen.">
            <div className="grid gap-4 md:grid-cols-2">
              <Stack gap="section">
                <Field required id="demo-email">
                  <FieldLabel>E-Mail</FieldLabel>
                  <input className="control-h w-full border border-line bg-surface px-2 text-ui text-fg" type="email" id="demo-email-control" aria-describedby="demo-email-description" />
                  <FieldDescription>Wir senden keine Bestätigung.</FieldDescription>
                </Field>
                <Field invalid id="demo-name">
                  <FieldLabel>Anzeigename</FieldLabel>
                  <input className="control-h w-full border border-critical bg-critical-subtle px-2 text-ui text-fg" id="demo-name-control" aria-invalid="true" aria-describedby="demo-name-error" />
                  <FieldError>Der Name darf nicht leer sein.</FieldError>
                </Field>
                <Field id="demo-select">
                  <FieldLabel>Umgebung</FieldLabel>
                  <Select defaultValue="prod">
                    <SelectTrigger>
                      <SelectValue placeholder="Wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dev">Entwicklung</SelectItem>
                      <SelectItem value="stage">Staging</SelectItem>
                      <SelectItem value="prod" description="Live für alle Nutzer.">
                        Produktion
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field id="demo-search">
                  <FieldLabel>Suche</FieldLabel>
                  <SearchInput label="Server durchsuchen" placeholder="Name oder IP" />
                </Field>
              </Stack>
              <Stack gap="section">
                <Row label="Auswahl">
                  <Checkbox label="Benachrichtigungen" defaultChecked />
                  <Switch label="Auto-Update" defaultChecked />
                </Row>
                <Field id="demo-radio">
                  <FieldLabel>Dichte</FieldLabel>
                  <RadioGroup defaultValue="default" aria-label="Dichte">
                    <Radio value="compact" label="Kompakt" />
                    <Radio value="default" label="Standard" />
                    <Radio value="comfortable" label="Komfortabel" />
                  </RadioGroup>
                </Field>
                <ToggleGroup type="single" defaultValue="grid" aria-label="Ansicht">
                  <Toggle value="grid">Raster</Toggle>
                  <Toggle value="list">Liste</Toggle>
                </ToggleGroup>
                <Field id="demo-slider">
                  <FieldLabel>Auslastung</FieldLabel>
                  <Slider label="CPU-Auslastung in Prozent" defaultValue={[42]} />
                </Field>
                <Field id="demo-textarea">
                  <FieldLabel>Notiz</FieldLabel>
                  <Textarea rows={3} placeholder="Optional" />
                </Field>
              </Stack>
            </div>
          </Demo>

          <Demo title="Rückmeldung" description="Jeder Zustand beantwortet die Frage, die er aufwirft.">
            <Stack gap="section">
              <Row>
                <StatusBadge domain="health" status="online" />
                <StatusBadge domain="health" status="degraded" />
                <StatusBadge domain="health" status="offline" />
                <StatusBadge domain="certificate" status="expiring" />
                <StatusBadge domain="crm" status="customer" />
              </Row>
              <Alert tone="critical" icon={<span aria-hidden="true">⚠</span>}>
                <Text size="ui" weight="semibold">
                  Verbindung fehlgeschlagen
                </Text>
                <Text size="micro" className="mt-1">
                  Die Verbindung zum Server wurde dreimal unterbrochen. Nach einem Neustart des Dienstes
                  sollte sie wiederhergestellt sein.
                </Text>
              </Alert>
              <Alert tone="info">
                <Text size="ui" weight="semibold">
                  Wartung am Sonntag
                </Text>
                <Text size="micro" className="mt-1">
                  Zwischen 02:00 und 04:00 Uhr ist keine Anmeldung möglich.
                </Text>
              </Alert>
              <Callout tone="caution" title="Ungespeicherte Änderungen">
                Bevor du den Bereich verlässt, werden deine Änderungen verworfen.
              </Callout>
              <Row label="Fortschritt">
                <div className="min-w-40 flex-1">
                  <Progress value={62} label="Sicherung läuft" valueText="62 von 100 MB" />
                </div>
                <div className="min-w-40 flex-1">
                  <Progress indeterminate label="Verarbeitung" />
                </div>
              </Row>
              <Row label="Laden">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
              </Row>
              <Row>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast({
                      title: "Einstellungen gespeichert",
                      description: "Die Änderung ist sofort aktiv.",
                      tone: "positive",
                    })
                  }
                >
                  Erfolgs-Toast auslösen
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast({
                      title: "Dienst nicht erreichbar",
                      description: "Der Dienst läuft seit 3 Min. nicht. Möchtest du ihn neu starten?",
                      tone: "critical",
                      duration: 12000,
                      action: { label: "Neu starten", onClick: () => undefined },
                    })
                  }
                >
                  Fehler-Toast mit Aktion auslösen
                </Button>
              </Row>
            </Stack>
          </Demo>

          <Demo title="Navigation" description="Tabs für Geschwister, Breadcrumb für Tiefe, Status für Zustand.">
            <Stack gap="section">
              <Breadcrumb>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#/components">Admin</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="#/components">Server</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>srv-01</BreadcrumbPage>
                </BreadcrumbItem>
              </Breadcrumb>
              <Tabs defaultValue="uebersicht">
                <TabsList>
                  <TabsTrigger value="uebersicht">Übersicht</TabsTrigger>
                  <TabsTrigger value="protokoll">Protokoll</TabsTrigger>
                  <TabsTrigger value="einstellungen">Einstellungen</TabsTrigger>
                </TabsList>
                <TabsContent value="uebersicht" className="pt-3">
                  <Text size="ui" tone="muted">
                    Der Tab-Inhalt ersetzt nur den Panel-Inhalt — die Seite bleibt stehen.
                  </Text>
                </TabsContent>
                <TabsContent value="protokoll" className="pt-3">
                  <Text size="ui" tone="muted">
                    Protokolle laden im Hintergrund; vorhandene Zeilen bleiben sichtbar.
                  </Text>
                </TabsContent>
                <TabsContent value="einstellungen" className="pt-3">
                  <Text size="ui" tone="muted">
                    Einstellungen sind eine eigene Ebene, kein Tab, wenn sie zu tief werden.
                  </Text>
                </TabsContent>
              </Tabs>
            </Stack>
          </Demo>
        </div>
      </Section>
    </>
  );
}

/* ========================================================================== */
/* Themes                                                                      */
/* ========================================================================== */

export function ThemesSection(): React.ReactElement {
  return (
    <Section
      eyebrow="Themes"
      title="Drei Identitäten, eine API"
      lead="Ein Theme ändert ausschließlich die Werte der semantischen Rollen. Keine Komponente kennt ein Theme, und keine Komponente enthält eine Farbe."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {THEMES.map((theme) => (
          <Card key={theme}>
            <CardHeader>
              <CardTitle level={3}>{theme}</CardTitle>
            </CardHeader>
            <CardBody>
              <Text size="micro" tone="muted">
                {theme === "tea"
                  ? "Die geteilte DNA, kontrastgeprüft. Kühl-neutral, goldene Aktion."
                  : theme === "hsm"
                    ? "Kühler und dunkler, Markenrot als Identität. Heimat der HomeServerManager-Reichweite."
                    : "Wärmere Flächen, LUTEA-Amber, kompakte Dichte als Vorgabe."}
              </Text>
              <Divider className="my-3" />
              <Row>
                <Button size="sm">Primär</Button>
                <Button size="sm" variant="secondary">
                  Sekundär
                </Button>
                <Button size="sm" variant="destructive">
                  Destruktiv
                </Button>
              </Row>
              <div className="mt-3 flex gap-1">
                {(["positive", "info", "caution", "critical", "neutral"] as const).map((tone) => (
                  <span
                    key={tone}
                    className={`h-6 flex-1 bg-${tone}`}
                    title={tone}
                  />
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      <Callout tone="info" title="Warum nur Dark?" className="mt-6">
        Beide Quellprodukte waren Dark-only, mit einer konfigurierten, aber nie
        angewendeten Light-Strategie. Eine zweite, ungetestete Palette ist eine
        zweite, ungetestete Palette. Die Token-Architektur ist farbschema-fähig —
        ein Light-Theme ist eine neue Referenz mit eigenem Kontrast-Audit.
      </Callout>
    </Section>
  );
}

/* ========================================================================== */
/* Admin                                                                       */
/* ========================================================================== */

const DEMO_NAV: NavItem[] = [
  { id: "uebersicht", label: "Übersicht", group: "Allgemein", icon: <Activity size={16} /> },
  { id: "server", label: "Server", group: "Allgemein", icon: <Server size={16} />, meta: "12" },
  { id: "speicher", label: "Speicher", group: "System & Daten", icon: <HardDrive size={16} /> },
  { id: "sicherheit", label: "Sicherheit", group: "System & Daten", icon: <ShieldCheck size={16} /> },
];

export function AdminSection(): React.ReactElement {
  const [active, setActive] = React.useState("uebersicht");

  return (
    <Section
      eyebrow="Admin UI"
      title="Informationsdichte, ohne Zustandschaos"
      lead="Der Admin-Layer ist auf Scannen und Tastatur-Workflows optimiert. Dieselbe Shell, dieselben Zustände, jedes TEA-Produkt."
    >
      <div className="overflow-hidden border border-line">
        <AdminShell
          product="TEA Showroom"
          nav={DEMO_NAV}
          activeId={active}
          onNavigate={setActive}
          status={<StatusBadge domain="health" status="online" />}
          actions={
            <Button size="sm" variant="outline">
              Aktion
            </Button>
          }
        >
          <div className="p-4 md:p-6">
            <Stack gap="section">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <Heading level={1} className="text-title">
                    {DEMO_NAV.find((entry) => entry.id === active)?.label ?? "Übersicht"}
                  </Heading>
                  <Text size="micro" tone="muted">
                    Live in der echten Application-Shell, inklusive Drawer unter 1024px.
                  </Text>
                </div>
                <RefreshingIndicator />
              </div>

              <StatGrid>
                <StatTile
                  label="Server online"
                  value="12"
                  hint="von 14 insgesamt"
                  tone="positive"
                  trend="up"
                  trendValue="+2"
                  icon={<Server size={14} />}
                />
                <StatTile
                  label="CPU-Last"
                  value="47 %"
                  trend="down"
                  trendValue="−6 %"
                  tone="info"
                  icon={<Cpu size={14} />}
                />
                <StatTile
                  label="Speicher"
                  value={formatBytes(412 * 1024 ** 3)}
                  tone="caution"
                  hint="von 1 TiB"
                  icon={<HardDrive size={14} />}
                />
                <StatTile
                  label="Laufzeit"
                  value={formatDuration(1000 * 60 * 60 * 50 + 1000 * 60 * 14)}
                  trend="flat"
                  trendValue="stabil"
                  icon={<Network size={14} />}
                />
              </StatGrid>

              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Ressourcen" description="Aktuelle Messwerte" level={2}>
                  <Stack gap="section">
                    <MetricCard
                      label="Arbeitsspeicher"
                      value="3,1 GiB"
                      percent={62}
                      tone="info"
                      icon={<MemoryStick size={14} />}
                    />
                    <MetricCard
                      label="Festplatte srv-01"
                      value="412 GiB"
                      percent={41}
                      tone="positive"
                      icon={<HardDrive size={14} />}
                    />
                  </Stack>
                </Panel>
                <Panel title="Zustände" description="Die drei Fälle, die jedes Panel braucht" level={2}>
                  <Stack gap="section">
                    <EmptyState
                      title="Keine Alarme"
                      description="Alle Dienste liegen innerhalb ihrer Schwellenwerte."
                    />
                    <LoadingState label="Messwerte werden geladen" rows={2} />
                    <ErrorState
                      error={{
                        title: "Verbindung fehlgeschlagen",
                        detail: "Der Dienst hat nach drei Versuchen nicht geantwortet.",
                        action: "Der Dienst läuft vermutlich noch. Ein Neustart behebt das meist.",
                        recovery: "action",
                        technical: "ECONNREFUSED 127.0.0.1:19090\n  at ServiceClient.request (…)",
                      }}
                      onRetry={() => undefined}
                    />
                  </Stack>
                </Panel>
              </div>
            </Stack>
          </div>
        </AdminShell>
      </div>
    </Section>
  );
}

/* ========================================================================== */
/* UX Standards                                                                */
/* ========================================================================== */

export function UxSection(): React.ReactElement {
  const states = Object.entries(FEEDBACK);

  return (
    <Section
      eyebrow="UX Standards"
      title="Regeln, die Code ersetzen"
      lead="Ein Standard, den niemand liest, ist keiner. Deshalb liegen die Regeln als Code vor: eine Status-Vokabel, eine Destruktivitäts-Matrix, ein Formularverhalten — und eine Komponente kann sie nicht versehentlich umgehen."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Die fünf Töne" description="Geschlossen. Keine sechste Farbe." level={2}>
          <Stack gap="ui" className="mt-1">
            {(["positive", "info", "caution", "critical", "neutral"] as const).map((tone) => (
              <div key={tone} className="flex items-center gap-3">
                <span className={`size-3 rounded-pill bg-${tone}`} aria-hidden="true" />
                <InlineCode>{tone}</InlineCode>
                <Text size="micro" tone="muted">
                  {
                    {
                      positive: "Zustand erreicht",
                      info: "Zustand in Bewegung",
                      caution: "Zustand braucht Aufmerksamkeit",
                      critical: "Zustand ist schlecht",
                      neutral: "kein Zustand",
                    }[tone]
                  }
                </Text>
              </div>
            ))}
          </Stack>
          <Callout tone="caution" title="Warum nicht Amber?" className="mt-4">
            <Text size="micro">
              In beiden Quellprodukten ist die Primärfarbe ein Gold. Ein bernsteinfarbenes
              Warnsignal wäre davon auf kleinen Flächen nicht zu unterscheiden. Deshalb ist
              <InlineCode>caution</InlineCode> orange.
            </Text>
          </Callout>
        </Panel>

        <Panel title="Der Status-Schlüssel" description="Ein Wort, ein Ton, eine Beschreibung" level={2}>
          <Stack gap="ui" className="mt-1">
            <div className="flex items-center gap-3">
              <StatusBadge domain="health" status="online" />
              <InlineCode>health.online</InlineCode>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge domain="health" status="degraded" />
              <InlineCode>health.degraded</InlineCode>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge domain="certificate" status="expiring" />
              <InlineCode>certificate.expiring</InlineCode>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge domain="crm" status="offer" />
              <InlineCode>crm.offer</InlineCode>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge domain="project" status="on_hold" />
              <InlineCode>project.on_hold</InlineCode>
            </div>
          </Stack>
          <Text size="micro" tone="muted" className="mt-3">
            Ein neuer Wire-Value ohne Label ist ein Typfehler. Das ist der Punkt: die fünf
            abweichenden Status-Tabellen der Quellprodukte können sich nicht wiederholen.
          </Text>
        </Panel>

        <Panel title="Die 17 Zustände" description="Benannt, damit man sich nicht neu erfindet" level={2}>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {states.map(([name, meta]) => (
              <div key={name} className="flex items-baseline gap-2">
                <InlineCode>{name}</InlineCode>
                <Text size="micro" tone="subtle">
                  {meta.label}
                </Text>
              </div>
            ))}
          </div>
          <Callout tone="info" title="Nie ersetzen, was lesbar ist" className="mt-4">
            <Text size="micro">
              <InlineCode>refreshing</InlineCode>, <InlineCode>syncing</InlineCode>,{" "}
              <InlineCode>stale</InlineCode> und <InlineCode>retrying</InlineCode> dürfen nie Inhalt
              ersetzen. Beide Quellprodukte haben bei jedem 5-Sekunden-Poll den ganzen Bereich
              durch einen Spinner ersetzt.
            </Text>
          </Callout>
        </Panel>

        <Panel title="Navigation" description="Die Frage entscheidet das Muster" level={2}>
          <Stack gap="ui" className="mt-2">
            {NAVIGATION_RULES.slice(0, 5).map((rule) => (
              <div key={rule.situation} className="border-b border-line pb-2 last:border-b-0">
                <Text size="ui" weight="medium">
                  {rule.use}
                </Text>
                <Text size="micro" tone="muted">
                  {rule.situation}
                </Text>
              </div>
            ))}
          </Stack>
        </Panel>
      </div>
    </Section>
  );
}

/* ========================================================================== */
/* Accessibility                                                               */
/* ========================================================================== */

export function AccessibilitySection(): React.ReactElement {
  return (
    <Section
      eyebrow="Accessibility"
      title="WCAG 2.2 AA, überprüfbar"
      lead="Kein Attest, sondern ein Bündel aus Tests, Bodenregeln im Stylesheet und einer Struktur, die die Fehlerklasse gar nicht erst zulässt."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Mechanisch erzwungen" level={2}>
          <List className="mt-1">
            <li>
              <InlineCode>text-red-300</InlineCode> existiert nicht — die Farbpaletten sind aus dem
              Build entfernt.
            </li>
            <li>
              <InlineCode>text-[9px]</InlineCode> existiert nicht — es gibt keine Stufe unter 11px.
            </li>
            <li>
              <InlineCode>rounded-md</InlineCode> existiert nicht — nur <InlineCode>none</InlineCode>{" "}
              und <InlineCode>pill</InlineCode>.
            </li>
            <li>
              Fokusringe sind ein Rezept; <InlineCode>focus:</InlineCode> statt{" "}
              <InlineCode>focus-visible:</InlineCode> ist verboten.
            </li>
            <li>prefers-reduced-motion schaltet jede Animation ab — global, mit !important.</li>
          </List>
        </Panel>
        <Panel title="Strukturell gelöst" level={2}>
          <List className="mt-1">
            <li>
              Das Feld-System verdrahtet <InlineCode>htmlFor</InlineCode>,{" "}
              <InlineCode>aria-describedby</InlineCode> und <InlineCode>aria-invalid</InlineCode>{" "}
              strukturell — ein nicht verknüpftes Label ist nicht ausdrückbar.
            </li>
            <li>
              <InlineCode>IconButton.label</InlineCode> ist Pflicht. Im Audit fehlte der Name bei
              fünf Knöpfen pro Tabellenzeile.
            </li>
            <li>
              <InlineCode>CardTitle</InlineCode> rendert eine echte Überschrift. Die Quelle tat das
              nicht — und hat damit jede Seitenstruktur eingeebnet.
            </li>
            <li>
              Zerstörerische Aktionen: Abbrechen ist der Fokus, destruktiv ist nie der Primärbutton.
            </li>
            <li>Touch-Ziele: unter 44px wird die Dichtehöhe als Minimum behandelt.</li>
          </List>
        </Panel>
      </div>

      <Panel title="Live ausprobieren" description="Alles hier ist mit der Tastatur bedienbar." level={2} className="mt-4">
        <Text size="micro" tone="muted" className="mb-3">
          Tab durch die Elemente und beobachte den Fokusring. Öffne den Dialog mit Enter und schließe
          ihn mit Escape — der Fokus kehrt an den Auslöser zurück.
        </Text>
        <Row>
          <Kbd>Tab</Kbd>
          <Kbd>Enter</Kbd>
          <Kbd>Escape</Kbd>
          <Kbd>ArrowDown</Kbd>
          <span className="text-fg-subtle">— alles, was rechts davon steht, ist fokussierbar.</span>
        </Row>
      </Panel>
    </Section>
  );
}

/* ========================================================================== */
/* Playground                                                                  */
/* ========================================================================== */

export function PlaygroundSection(): React.ReactElement {
  const [value, setValue] = React.useState("srv-01");
  const [notes, setNotes] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const runSave = () => {
    setBusy(true);
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((previous) => {
        if (previous >= 100) {
          clearInterval(timer);
          setBusy(false);
          toast({ title: "Gespeichert", tone: "positive" });
          return 100;
        }
        return previous + 20;
      });
    }, 180);
  };

  return (
    <Section
      eyebrow="Playground"
      title="Zustände und Verhalten, nicht nur Optik"
      lead="Dieselben Komponenten, mit dem Verhalten, das ein Produkt wirklich auslöst."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Formular mit Validierung" description="onBlur, nicht bei jedem Tastenanschlag" level={2}>
          <Stack gap="section">
            <Field required id="pg-host">
              <FieldLabel>Hostname</FieldLabel>
              <input
                id="pg-host-control"
                className="control-h w-full border border-line bg-surface px-2 text-ui text-fg"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onBlur={() => undefined}
              />
              <FieldDescription>Kleinbuchstaben, Zahlen und Bindestriche.</FieldDescription>
            </Field>
            <Field invalid={value.trim() === ""} id="pg-notes">
              <FieldLabel>Notiz</FieldLabel>
              <Textarea
                rows={3}
                value={notes}
                placeholder="Optional"
                onChange={(event) => setNotes(event.target.value)}
              />
              {value.trim() === "" ? <FieldError>Der Hostname darf nicht leer sein.</FieldError> : null}
            </Field>
            <Row>
              <Button onClick={runSave} loading={busy}>
                {busy ? "Wird gespeichert" : "Speichern"}
              </Button>
              <Button variant="ghost" onClick={() => setNotes("")}>
                Zurücksetzen
              </Button>
              {busy ? <div className="min-w-32 flex-1"><Progress value={progress} label="Fortschritt" /></div> : null}
            </Row>
          </Stack>
        </Panel>

        <Panel title="Combobox" description="Vollständiges Listbox-Muster mit Pfeiltasten" level={2}>
          <Stack gap="section">
            <Combobox
              label="Server auswählen"
              placeholder="Name eingeben"
              options={[
                { value: "srv-01", label: "srv-01", description: "12 GiB RAM · 2 vCPU" },
                { value: "srv-02", label: "srv-02", description: "8 GiB RAM · 2 vCPU" },
                { value: "db-01", label: "db-01", description: "64 GiB RAM · 16 vCPU" },
                { value: "cache-01", label: "cache-01", description: "4 GiB RAM · 1 vCPU", disabled: true },
              ]}
            />
            <Text size="micro" tone="muted">
              Pfeil runter bewegt die aktive Option, Enter wählt, Escape leert zuerst die Eingabe.
            </Text>
          </Stack>
        </Panel>
      </div>
    </Section>
  );
}

/* ========================================================================== */
/* Architecture                                                                */
/* ========================================================================== */

const PACKAGES: Array<{ name: string; role: string; exports: string }> = [
  { name: "@tea-ui/utils", role: "Klassen zusammenführen, Varianten, Präfix", exports: "3" },
  { name: "@tea-ui/tokens", role: "Rollen, Themes, Dichte, Bewegung, Breakpoints", exports: "3" },
  { name: "@tea-ui/ux-standards", role: "Statusregister, Töne, Zustände, Terminologie", exports: "— " },
  { name: "@tea-ui/icons", role: "Kuratierte Icon-Menge statt 1600er Bibliothek", exports: "90" },
  { name: "@tea-ui/core", role: "Primitive: Layout, Typo, Eingaben, Overlays", exports: "120+" },
  { name: "@tea-ui/admin", role: "Shell, Metriken, Zustände, Datensurfaces", exports: "—" },
  { name: "@tea-ui/public", role: "Marketing, Website, Content, Conversion", exports: "—" },
  { name: "@tea-ui/patterns", role: "Wiederverwendbare Interaktionskompositionen", exports: "—" },
  { name: "@tea-ui/templates", role: "Vollständige Seitenstrukturen", exports: "—" },
  { name: "@tea-ui/blueprints", role: "Feature-Systeme (Auth, Billing, Onboarding)", exports: "—" },
  { name: "@tea-ui/specialized", role: "Schwere Opt-ins: Charts, Bäume, Diff", exports: "—" },
];

export function ArchitectureSection(): React.ReactElement {
  return (
    <Section
      eyebrow="Architektur"
      title="Grenzen, die man überprüfen kann"
      lead="Jede Paketgrenze ist eine Dependency-Richtung, und jede Richtung wird in CI geprüft. Ein Import nach oben ist ein Fehler, kein Stil."
    >
      <Panel title="Pakete" level={2}>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-ui">
            <caption className="sr-only">Die TEA-UI-Pakete und ihre Rollen</caption>
            <thead>
              <tr className="border-b border-line text-start">
                <th scope="col" className="py-2 pe-4 text-start text-label font-semibold uppercase tracking-widest text-fg-subtle">
                  Paket
                </th>
                <th scope="col" className="py-2 pe-4 text-start text-label font-semibold uppercase tracking-widest text-fg-subtle">
                  Rolle
                </th>
                <th scope="col" className="py-2 text-start text-label font-semibold uppercase tracking-widest text-fg-subtle">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {PACKAGES.map((entry) => (
                <tr key={entry.name} className="border-b border-line/50 last:border-b-0">
                  <td className="py-2 pe-4 align-top">
                    <InlineCode>{entry.name}</InlineCode>
                  </td>
                  <td className="py-2 pe-4 align-top text-fg-muted">{entry.role}</td>
                  <td className="py-2 align-top">
                    {entry.exports === "— " ? (
                      <Badge tone="neutral" variant="outline">
                        geplant
                      </Badge>
                    ) : (
                      <Badge tone="positive">{entry.exports}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Panel title="Dependency-Regel" level={2}>
          <Text size="ui" tone="muted">
            Abhängigkeiten zeigen nur nach unten. Core kennt Admin nicht; Admin kennt Public nicht.
            Wer eine Ebene braucht, geht eine Ebene nach oben — und die Prüfung in CI schlägt dann
            fehl.
          </Text>
        </Panel>
        <Panel title="Bündel" level={2}>
          <Text size="ui" tone="muted">
            <InlineCode>sideEffects: false</InlineCode>, ESM, und der Rollup-Treeshake-Lauf misst
            die Behauptung statt sie zu behaupten. Ein Import von <InlineCode>@tea-ui/core</InlineCode>{" "}
            zieht React und Radix mit, aber kein Produkt, kein API-Client, keinen Router.
          </Text>
        </Panel>
      </div>
    </Section>
  );
}
