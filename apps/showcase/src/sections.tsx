import * as React from "react";
import {
  Activity,
  CircleAlert,
  Cpu,
  ExternalLink,
  HardDrive,
  MemoryStick,
  Network,
  RotateCcw,
  Server,
  ShieldCheck,
} from "@tea-ui/icons";
import { THEMES } from "@tea-ui/tokens";
import { FEEDBACK, NAVIGATION_RULES } from "@tea-ui/ux-standards";
import {
  Badge,
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Combobox,
  Divider,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Heading,
  InlineCode,
  Input,
  Kbd,
  List,
  Panel,
  Progress,
  SearchInput,
  Stack,
  StatusBadge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  formatBytes,
  formatDuration,
  toast,
} from "@tea-ui/core";
import {
  AdminShell,
  CardGrid,
  CardGridItem,
  DEFAULT_SCORE_BANDS,
  EmptyState,
  ErrorState,
  IconTile,
  LEAD_SCORE_BANDS,
  LoadingState,
  MetricCard,
  RefreshButton,
  RefreshingIndicator,
  DesktopShell,
  RowActions,
  Score,
  StatGrid,
  StatTile,
  type DesktopPlatform,
  type DesktopWindow,
  type NavItem,
} from "@tea-ui/admin";
import { ActionBar, FilterBar, SaveBar, type SaveBarState } from "@tea-ui/patterns";
import { SettingsTemplate, type SettingsSection } from "@tea-ui/templates";

import { DensityControls } from "./display";
import { Row, Section, useHashQuery } from "./chrome";

/* ========================================================================== */
/* Demo data — real values, not lorem ipsum                                    */
/* ========================================================================== */

interface DemoServer {
  id: string;
  name: string;
  host: string;
  status: "online" | "degraded" | "offline";
  disk: number;
}


const SERVERS: readonly DemoServer[] = [
  { id: "srv-01", name: "srv-01", host: "10.0.0.21", status: "online", disk: 62 },
  { id: "srv-02", name: "srv-02", host: "10.0.0.22", status: "degraded", disk: 91 },
  { id: "srv-03", name: "srv-03", host: "10.0.0.23", status: "online", disk: 44 },
  { id: "mc-01", name: "mc-01", host: "10.0.0.31", status: "offline", disk: 78 },
];

/* ========================================================================== */
/* Home                                                                        */
/* ========================================================================== */

export function HomeSection(): React.ReactElement {
  return (
    <>
      <Section
        eyebrow="The shared base"
        title="Build once. Generalize properly. Reuse everywhere."
        lead="TEA UI is a UI, UX and design-system library. A second surface that needs the same component builds on the same one, rather than arriving at its own third version of it."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "One codebase",
              body: "Components, tokens, icons and UX standards live in one place, checked as one package graph. A defect is fixed once.",
            },
            {
              title: "One behaviour",
              body: "Two surfaces solving the same interaction problem behave the same way, unless the difference is written down.",
            },
            {
              title: "One measure",
              body: "WCAG 2.2 AA, a type scale, a closed set of type and colour roles. No surface gets an exception.",
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
    </>
  );
}


/**
 * Why the tone swatches are a literal list and not `` `bg-${tone}` ``.
 *
 * Tailwind extracts class names by scanning source text, so a constructed class
 * is invisible to it. `bg-${tone}` therefore produces no CSS at all — the
 * swatches in this section would render only because `Badge` and `StatusBadge`
 * happen to write `bg-positive` and friends somewhere else in the codebase. That
 * is the same trap as an invented utility name: the element looks styled in a
 * page that happens to include the right other components, and unstyled
 * everywhere else.
 */
const THEME_TONES = [
  { tone: "positive", className: "bg-positive" },
  { tone: "info", className: "bg-info" },
  { tone: "caution", className: "bg-caution" },
  { tone: "critical", className: "bg-critical" },
  { tone: "neutral", className: "bg-neutral" },
] as const;

const THEME_NOTES: Record<(typeof THEMES)[number], string> = {
  tea: "The shared DNA. Cool-neutral, gold action colour, 22 contrast checks.",
  pop: "Spring 2007, the Web 2.0 peak. Sky Blue, Flickr Pink, Flock Blue — every colour actually published, every one measured.",
  ton: "Late 2007, the turn away from gloss. Vermillion, Ruby Red, ochre on warm dark grey. Two hexes raised in value because the originals miss 4.5:1.",
};

export function ThemesSection(): React.ReactElement {
  return (
    <Section
      eyebrow="Themes"
      title="Three identities, one API"
      lead="A theme changes the values of the semantic roles and nothing else. No component knows a theme exists, and no component contains a colour."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {THEMES.map((theme) => (
          /*
           * `data-theme` on the card, not on the page. This section claimed to
           * show three identities and rendered three pixel-identical cards,
           * because nothing here ever applied the theme it was naming. Themes
           * are attribute-driven, so a single element can carry one — which is
           * also what makes them previewable side by side at all.
           */
          <Card key={theme} data-theme={theme}>
            <CardHeader>
              <CardTitle level={3}>{theme}</CardTitle>
            </CardHeader>
            <CardBody>
              <Text size="micro" tone="muted">
                {THEME_NOTES[theme]}
              </Text>
              <Divider className="my-3" />
              <Row>
                <Button size="sm">Primary</Button>
                <Button size="sm" variant="secondary">
                  Secondary
                </Button>
                <Button size="sm" variant="destructive">
                  Destructive
                </Button>
              </Row>
              <div className="mt-3 flex gap-1">
                {THEME_TONES.map((entry) => (
                  <span key={entry.tone} className={`h-6 flex-1 ${entry.className}`} title={entry.tone} />
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      <Callout tone="info" title="Why dark only?" className="mt-6">
        The token architecture is colour-scheme-capable. A light theme is a new reference with its
        own contrast audit rather than a flag, and an untested second palette is still an untested
        second palette — so it has to be built deliberately, not flipped on.
      </Callout>
    </Section>
  );
}

/* ========================================================================== */
/* Admin                                                                       */
/* ========================================================================== */

const DEMO_NAV: NavItem[] = [
  { id: "overview", label: "Overview", group: "General", icon: <Activity size={16} /> },
  { id: "server", label: "Servers", group: "General", icon: <Server size={16} />, meta: "12" },
  { id: "storage", label: "Storage", group: "System & data", icon: <HardDrive size={16} /> },
  { id: "security", label: "Security", group: "System & data", icon: <ShieldCheck size={16} /> },
];

export function AdminSection(): React.ReactElement {
  const [active, setActive] = React.useState("overview");
  const [rowNotice, setRowNotice] = React.useState("");
  const [refreshingIndicator, setRefreshingIndicator] = React.useState(false);

  return (
    <Section
      eyebrow="Admin UI"
      title="Information density without state chaos"
      lead="The admin layer is built for scanning and for keyboard workflows. The same shell and the same states everywhere."
    >
      <div className="overflow-hidden border border-line">
        <AdminShell
          product="TEA Showroom"
          tagline="Design system console"
          nav={DEMO_NAV}
          activeId={active}
          onNavigate={setActive}
          status={<StatusBadge domain="health" status="online" />}
          actions={
            <Button size="sm" variant="outline">
              Action
            </Button>
          }
        >
          <div className="p-4 md:p-6">
            <Stack gap="section">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <Heading level={1} className="text-title">
                    {DEMO_NAV.find((entry) => entry.id === active)?.label ?? "Overview"}
                  </Heading>
                  <Text size="micro" tone="muted">
                    Live in the real application shell, including the drawer below 1024px.
                  </Text>
                </div>
                <RefreshingIndicator />
              </div>

              <StatGrid>
                <StatTile
                  label="Servers online"
                  value="12"
                  hint="of 14 in total"
                  tone="positive"
                  trend="up"
                  trendValue="+2"
                  icon={<Server size={14} />}
                />
                <StatTile
                  label="CPU load"
                  value="47 %"
                  trend="down"
                  trendValue="−6 %"
                  tone="info"
                  icon={<Cpu size={14} />}
                />
                <StatTile
                  label="Storage"
                  value={formatBytes(412 * 1024 ** 3)}
                  tone="caution"
                  hint="of 1 TiB"
                  icon={<HardDrive size={14} />}
                />
                <StatTile
                  label="Uptime"
                  value={formatDuration(1000 * 60 * 60 * 50 + 1000 * 60 * 14)}
                  trend="flat"
                  trendValue="stable"
                  icon={<Network size={14} />}
                />
              </StatGrid>

              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Resources" description="Current readings" level={2}>
                  <Stack gap="section">
                    <MetricCard
                      label="Memory"
                      value="3,1 GiB"
                      percent={62}
                      tone="info"
                      icon={<MemoryStick size={14} />}
                    />
                    <MetricCard
                      label="Disk on srv-01"
                      value="412 GiB"
                      percent={41}
                      tone="positive"
                      icon={<HardDrive size={14} />}
                    />
                  </Stack>
                </Panel>
                <Panel title="States" description="The three cases every panel needs" level={2}>
                  <Stack gap="section">
                    <EmptyState
                      title="No alarms"
                      description="Every service is inside its thresholds."
                    />
                    <LoadingState label="Loading readings" rows={2} elapsedMs={400} />
                    <ErrorState
                      error={{
                        title: "Connection failed",
                        detail: "The service did not answer after three attempts.",
                        action: "The service is probably still running. A restart usually fixes this.",
                        recovery: "action",
                        technical: "ECONNREFUSED 127.0.0.1:19090\n  at ServiceClient.request (…)",
                      }}
                      onRetry={() => undefined}
                    />
                  </Stack>
                </Panel>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Panel
                  title="Score"
                  description="Number, band label and tone — three signals. The thresholds are a product decision."
                  level={2}
                >
                  <Stack gap="section">
                    <Row label="Default thresholds (45)">
                      <div className="min-w-48 flex-1">
                        <Score value={82} caption="Lead quality" label="Lead quality" />
                      </div>
                      <div className="min-w-48 flex-1">
                        <Score value={52} caption="Link health" label="Link health" />
                      </div>
                      <div className="min-w-48 flex-1">
                        <Score value={18} caption="Data quality" label="Data quality" />
                      </div>
                    </Row>
                    <Row label="Softer threshold (40)">
                      <div className="min-w-48 flex-1">
                        <Score
                          value={42}
                          caption="Maturity"
                          label="Maturity"
                          bands={LEAD_SCORE_BANDS}
                        />
                      </div>
                      <div className="min-w-48 flex-1">
                        <Score value={42} caption="For comparison" label="For comparison" />
                      </div>
                    </Row>
                    <Row label="No value">
                      <div className="min-w-48 flex-1">
                        <Score value={0} caption="Backfill" label="Backfill" indeterminate />
                      </div>
                    </Row>
                    <Callout tone="info" title="Why the tone is never neutral at the bottom">
                      Where the threshold sits is a domain question and stays configurable, but a
                      measured value of zero is not the same as no measurement — so a measured bad
                      result reads as bad under both threshold sets.
                      {" "}
                      {DEFAULT_SCORE_BANDS.length} bands, no state without a verdict.
                    </Callout>
                  </Stack>
                </Panel>

                <Panel
                  title="Cards and tiles"
                  description="IconTile never carries its own name. CardGrid is a list, because a list is countable."
                  level={2}
                >
                  <Stack gap="section">
                    <Row label="IconTile">
                      <IconTile size="sm" tone="neutral">
                        <Server size={12} />
                      </IconTile>
                      <IconTile tone="positive">
                        <ShieldCheck size={14} />
                      </IconTile>
                      <IconTile size="lg" tone="caution">
                        <Activity size={16} />
                      </IconTile>
                      <IconTile size="lg" tone="critical">
                        <CircleAlert size={16} />
                      </IconTile>
                      <IconTile size="lg" tone="brand">
                        <Cpu size={16} />
                      </IconTile>
                    </Row>
                    <CardGrid minCardWidth="12rem">
                      {SERVERS.slice(0, 4).map((server) => (
                        <CardGridItem key={server.id}>
                          <Card className="flex items-center gap-3 p-3">
                            <IconTile tone={server.status === "online" ? "positive" : "caution"}>
                              <Server size={14} />
                            </IconTile>
                            <div className="min-w-0">
                              <p className="text-ui font-medium text-fg">{server.name}</p>
                              <p className="text-micro text-fg-muted">
                                {server.host} · {server.disk} % belegt
                              </p>
                            </div>
                          </Card>
                        </CardGridItem>
                      ))}
                    </CardGrid>
                  </Stack>
                </Panel>
              </div>

              <Panel
                title="Row actions"
                description="The dangerous action goes last. The overflow button names the region, not itself."
                level={2}
              >
                <Stack gap="section">
                  <Table label="Actions per row">
                    <TableCaption>The actions available on each row</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Server</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-64 text-end">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {SERVERS.map((server) => (
                        <TableRow key={server.id}>
                          <TableCell>{server.name}</TableCell>
                          <TableCell>
                            <StatusBadge domain="health" status={server.status} />
                          </TableCell>
                          <TableCell>
                            <RowActions
                              overflowLabel={`Actions for ${server.name}`}
                              primary={{
                                label: `Open ${server.name}`,
                                icon: <ExternalLink size={14} />,
                                onSelect: () => setRowNotice(`${server.name} opened`),
                              }}
                              items={[
                                {
                                  label: "Restart",
                                  icon: <RotateCcw size={14} />,
                                  onSelect: () => setRowNotice(`${server.name} neu gestartet`),
                                },
                                {
                                  label: "Copy",
                                  onSelect: () => setRowNotice(`${server.name} kopiert`),
                                },
                              ]}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Text size="micro" tone="muted">
                    Last action: <span className="text-fg">{rowNotice || "—"}</span>
                  </Text>
                  <Row>
                    <RefreshButton
                      onClick={() => {
                        setRowNotice("Refreshed");
                        setRefreshingIndicator(true);
                        globalThis.setTimeout(() => setRefreshingIndicator(false), 1600);
                      }}
                    />
                    {refreshingIndicator ? <RefreshingIndicator /> : null}
                  </Row>
                </Stack>
              </Panel>
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
      title="Rules that replace a document"
      lead="A standard nobody reads is not a standard. So the rules ship as code: a status vocabulary, a destructiveness matrix, a form behaviour — and a component cannot route around them by accident."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="The five tones" description="Closed. There is no sixth colour." level={2}>
          <Stack gap="ui" className="mt-1">
            {(["positive", "info", "caution", "critical", "neutral"] as const).map((tone) => (
              <div key={tone} className="flex items-center gap-3">
                <span className={`size-3 rounded-pill bg-${tone}`} aria-hidden="true" />
                <InlineCode>{tone}</InlineCode>
                <Text size="micro" tone="muted">
                  {
                    {
                      positive: "state reached",
                      info: "state in motion",
                      caution: "state needs attention",
                      critical: "state is bad",
                      neutral: "no state",
                    }[tone]
                  }
                </Text>
              </div>
            ))}
          </Stack>
          <Callout tone="caution" title="Why not amber?" className="mt-4">
            <Text size="micro">
              The primary colour is a gold, and an amber warning would not be distinguishable from
              it on small areas. That is why <InlineCode>caution</InlineCode> is orange.
            </Text>
          </Callout>
        </Panel>

        <Panel title="The status key" description="One word, one tone, one description" level={2}>
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
            A new wire value without a label is a type error. That is the point: a second
            hand-written status table cannot be written by accident.
          </Text>
        </Panel>

        <Panel title="The 17 states" description="Named, so nobody reinvents them" level={2}>
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
          <Callout tone="info" title="Never replace what is readable" className="mt-4">
            <Text size="micro">
              <InlineCode>refreshing</InlineCode>, <InlineCode>syncing</InlineCode>,{" "}
              <InlineCode>stale</InlineCode> and <InlineCode>retrying</InlineCode> must never
              replace the content itself — a five-second poll is not a reason to blank the region.
            </Text>
          </Callout>
        </Panel>

        <Panel title="Navigation" description="The question decides the pattern" level={2}>
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
      title="WCAG 2.2 AA, verifiable"
      lead="Not an attestation but a set of tests, floor rules in the stylesheet, and a structure that does not permit the error class in the first place."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Enforced mechanically" level={2}>
          <List className="mt-1">
            <li>
              <InlineCode>text-red-300</InlineCode> does not exist — the colour palettes were
              removed from the build.
            </li>
            <li>
              <InlineCode>text-[9px]</InlineCode> does not exist — there is no step below 11px.
            </li>
            <li>
              <InlineCode>rounded-md</InlineCode> does not exist — only <InlineCode>none</InlineCode>{" "}
              and <InlineCode>pill</InlineCode>.
            </li>
            <li>
              Focus rings are a recipe; <InlineCode>focus:</InlineCode> instead of{" "}
              <InlineCode>focus-visible:</InlineCode> is rejected.
            </li>
            <li>prefers-reduced-motion switches off every animation — globally, with !important.</li>
          </List>
        </Panel>
        <Panel title="Solved structurally" level={2}>
          <List className="mt-1">
            <li>
              The field system wires <InlineCode>htmlFor</InlineCode>,{" "}
              <InlineCode>aria-describedby</InlineCode> and <InlineCode>aria-invalid</InlineCode>{" "}
              structurally — an unlinked label is not expressible.
            </li>
            <li>
              <InlineCode>IconButton.label</InlineCode> is required. An unnamed icon button is not
              constructible.
            </li>
            <li>
              <InlineCode>CardTitle</InlineCode> renders a real heading, so a page built from cards
              still has a document outline.
            </li>
            <li>
              Destructive actions: cancel takes the focus, and destructive is never the primary
              button.
            </li>
            <li>Touch targets: below 44px the density's own height is treated as the minimum.</li>
          </List>
        </Panel>
      </div>

      <Panel title="Try it live" description="Everything here is keyboard-operable." level={2} className="mt-4">
        <Text size="micro" tone="muted" className="mb-3">
          Tab through the elements and watch the focus ring. Open the dialog with Enter and close it
          with Escape — the focus returns to the trigger.
        </Text>
        <Row>
          <Kbd>Tab</Kbd>
          <Kbd>Enter</Kbd>
          <Kbd>Escape</Kbd>
          <Kbd>ArrowDown</Kbd>
          <span className="text-fg-subtle">— everything to the right of it is focusable.</span>
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
          toast({ title: "Saved", tone: "positive" });
          return 100;
        }
        return previous + 20;
      });
    }, 180);
  };

  return (
    <Section
      eyebrow="Playground"
      title="States and behaviour, not just looks"
      lead="The same components, with the behaviour a real application triggers."
    >
      {/* Density is a tuning decision, so it lives where tuning happens. It was
          in the header next to the theme switcher, where six controls shared a
          56px row with the navigation and nobody scrolled past them anyway. */}
      <Panel
        title="Information density"
        description="Three densities, one token. Every space in the system comes from data-density."
        level={2}
        className="mb-4"
      >
        <Stack gap="field">
          <DensityControls />
          <Callout tone="info" title="Why not in the header?">
            The header carries orientation, not adjustment. A density you occasionally change
            belongs where adjustment happens — and a control nobody can reach is not a control.
          </Callout>
        </Stack>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Form with validation" description="onBlur, not on every keystroke" level={2}>
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
              {value.trim() === "" ? <FieldError>The hostname must not be empty.</FieldError> : null}
            </Field>
            <Row>
              <Button onClick={runSave} loading={busy}>
                {busy ? "Saving" : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => setNotes("")}>
                Reset
              </Button>
              {busy ? <div className="min-w-32 flex-1"><Progress value={progress} label="Progress" /></div> : null}
            </Row>
          </Stack>
        </Panel>

        <Panel title="Combobox" description="The full listbox pattern with arrow keys" level={2}>
          <Stack gap="section">
            <Combobox
              label="Select a server"
              placeholder="Type a name"
              options={[
                { value: "srv-01", label: "srv-01", description: "12 GiB RAM · 2 vCPU" },
                { value: "srv-02", label: "srv-02", description: "8 GiB RAM · 2 vCPU" },
                { value: "db-01", label: "db-01", description: "64 GiB RAM · 16 vCPU" },
                { value: "cache-01", label: "cache-01", description: "4 GiB RAM · 1 vCPU", disabled: true },
              ]}
            />
            <Text size="micro" tone="muted">
              Arrow down moves the active option, Enter selects, Escape clears the input first.
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

/**
 * `symbols` is the count `npm run check:exports` verifies — the named exports of
 * a package entry, which is what a consumer's import actually resolves against.
 * It is deliberately the same metric in every row: the previous table mixed
 * named exports, component counts and icon counts in one column, so `icons` read
 * 90 and `core` read 120+ while the export contract said 1 and 62. Three
 * incompatible metrics in one column is a table nobody can check.
 *
 * `symbols: null` means the package is declared in the boundary check and ships
 * nothing. That is a real state worth showing, but it has to be distinguishable
 * from "has exports we did not count" — so it is its own value, not a dash in
 * the same column. Every non-null number is the one `npm run check:exports`
 * prints for that package, so the column can be re-checked instead of believed.
 *
 * `@tea-ui/patterns` used to sit in the null rows and no longer does: it ships
 * `FilterBar` and `ActionBar` and is now measured by that script like the rest.
 */
const PACKAGES: Array<{ name: string; role: string; symbols: number | null; gzip: string }> = [
  { name: "@tea-ui/utils", role: "Class merging, variants, prefixing", symbols: 4, gzip: "0.7 kB" },
  { name: "@tea-ui/tokens", role: "Roles, themes, density, motion, breakpoints", symbols: 6, gzip: "0.9 kB" },
  { name: "@tea-ui/ux-standards", role: "Status registry, tones, states, terminology", symbols: 15, gzip: "0.7 kB" },
  { name: "@tea-ui/icons", role: "A curated icon set rather than a 1600-icon library", symbols: 1, gzip: "1.6 kB" },
  { name: "@tea-ui/core", role: "Primitives: layout, type, inputs, overlays", symbols: 62, gzip: "0.7 kB" },
  { name: "@tea-ui/admin", role: "Shell, metrics, states, data surfaces", symbols: 8, gzip: "0.4 kB" },
  { name: "@tea-ui/public", role: "Marketing, site, content, conversion", symbols: 10, gzip: "2.9 kB" },
  { name: "@tea-ui/patterns", role: "Reusable interaction compositions", symbols: 7, gzip: "1.4 kB" },
  { name: "@tea-ui/templates", role: "Complete page structures", symbols: 3, gzip: "1.0 kB" },
  { name: "@tea-ui/blueprints", role: "Feature systems (auth, billing, onboarding)", symbols: null, gzip: "—" },
  { name: "@tea-ui/specialized", role: "Heavy opt-ins: charts, trees, diff", symbols: null, gzip: "—" },
];

export function ArchitectureSection(): React.ReactElement {
  return (
    <Section
      eyebrow="Architecture"
      title="Boundaries you can check"
      lead="Every package boundary is a dependency direction, and every direction is checked in CI. An import upwards is an error, not a style."
    >
      <Panel title="Packages" level={2}>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-ui">
            <caption className="sr-only">The TEA UI packages, their roles and what importing each one costs</caption>
            <thead>
              <tr className="border-b border-line text-start">
                <th scope="col" className="py-2 pe-4 text-start text-label font-semibold uppercase tracking-widest text-fg-subtle">
                  Package
                </th>
                <th scope="col" className="py-2 pe-4 text-start text-label font-semibold uppercase tracking-widest text-fg-subtle">
                  Role
                </th>
                <th scope="col" className="py-2 text-start text-label font-semibold uppercase tracking-widest text-fg-subtle">
                  Exports
                </th>
                <th scope="col" className="py-2 text-start text-label font-semibold uppercase tracking-widest text-fg-subtle">
                  Cost
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
                    {entry.symbols === null ? (
                      <Badge tone="neutral" variant="outline">
                        declared, not implemented
                      </Badge>
                    ) : (
                      <Badge tone="positive">{entry.symbols}</Badge>
                    )}
                  </td>
                  <td className="py-2 align-top text-fg-muted">{entry.gzip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Panel title="Dependency rule" level={2}>
          <Text size="ui" tone="muted">
            Dependencies point downwards only. Core does not know Admin; Admin does not know Public.
            If you need a level, you move up one — and then the check in CI fails.
          </Text>
        </Panel>
        <Panel title="Bundles" level={2}>
          <Text size="ui" tone="muted">
            <InlineCode>sideEffects: false</InlineCode>, ESM, and the Rollup tree-shake run measures
            the claim instead of making it. Importing <InlineCode>@tea-ui/core</InlineCode>{" "}
            pulls in React and Radix, but no product, no API client and no router.
          </Text>
        </Panel>
      </div>
    </Section>
  );
}

/* --- patterns -------------------------------------------------------------- */

/**
 * A filter over a fixed list, so the count is real rather than decorative.
 *
 * The Showcase used to render `FilterBar` with a hardcoded number, which proves
 * nothing: a count that never changes cannot demonstrate that it is announced,
 * and a Reset that is always visible cannot demonstrate that it is bound to the
 * filter. Both claims are the entire contract, so both have to be falsifiable
 * here or the demo is theatre.
 *
 * **The filter state is in the hash, not in `useState`** — `#/patterns?filter=eu&running=1`,
 * which is `URL_SYNC.inUrl` applied to the demo that is about filtering. Reload
 * the page and the view comes back; paste the URL into a message and the other
 * person sees the same three servers. Neither was true while this was local
 * state, and a demo of a shared component whose own state cannot be shared is
 * the exact defect the standard exists to prevent.
 *
 * `FilterBar` itself is unchanged and stays state-agnostic: it receives `query`
 * and reports changes like any consumer. The demo is the layer that decided the
 * filter belongs in the URL, which is the layer the standard addresses.
 */
const ROWS = [
  { id: "srv-01", name: "api-01", state: "running", region: "eu-central" },
  { id: "srv-02", name: "api-02", state: "degraded", region: "eu-central" },
  { id: "srv-03", name: "worker-01", state: "running", region: "us-east" },
  { id: "srv-04", name: "worker-02", state: "stopped", region: "us-east" },
  { id: "srv-05", name: "db-01", state: "running", region: "eu-west" },
];

function FilterBarDemo(): React.ReactElement {
  const [params, setParams] = useHashQuery();

  /*
   * A missing parameter is the default, not an empty string that has to be
   * written back. `#/patterns` and `#/patterns?filter=` therefore mean the same
   * thing — unfiltered — so an unfiltered link stays short enough to paste into
   * a sentence, and there is no second URL for the same view.
   */
  const query = params.get("filter") ?? "";
  const onlyRunning = params.get("running") === "1";

  const matches = ROWS.filter((row) => {
    if (onlyRunning && row.state !== "running") return false;
    if (!query) return true;
    return `${row.name} ${row.region}`.toLowerCase().includes(query.toLowerCase());
  });

  const filtering = query !== "" || onlyRunning;

  /** Mutate a copy, so an unchanged field does not drop the other one. */
  const update = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    mutate(next);
    setParams(next);
  };

  return (
    <Stack gap="lg">
      <FilterBar
        label="Filter servers"
        matchCount={matches.length}
        totalCount={ROWS.length}
        active={filtering}
        onReset={() =>
          update((next) => {
            next.delete("filter");
            next.delete("running");
          })
        }
      >
        <SearchInput
          label="Search servers"
          placeholder="Search name or region"
          value={query}
          onValueChange={(value) =>
            update((next) => {
              if (value) next.set("filter", value);
              else next.delete("filter");
            })
          }
        />
        <Button
          variant={onlyRunning ? "primary" : "outline"}
          // `aria-pressed` because this is a toggle, not a momentary action: the
          // applied state has to survive being read out, and the colour alone
          // does not say which variant is currently in force.
          aria-pressed={onlyRunning}
          onClick={() =>
            update((next) => {
              if (onlyRunning) next.delete("running");
              else next.set("running", "1");
            })
          }
        >
          Running only
        </Button>
      </FilterBar>

      <Text tone="muted" size="ui">
        {matches.length === 0
          ? "No server matches. Reset stays in the bar, so the cause is one click away."
          : matches.map((row) => row.name).join(", ")}
      </Text>
      <Text tone="subtle" size="micro">
        <InlineCode>#/patterns{filtering ? `?${params.toString()}` : ""}</InlineCode> — reload or share this
        address to get the same view.
      </Text>
    </Stack>
  );
}

/**
 * Seven actions on purpose.
 *
 * Five render inline and two move into the overflow menu, which is the behaviour
 * that cannot be seen in a three-action screenshot. Delete is deliberately passed
 * *first*: the bar moves it to the far end regardless, which is the point of
 * enforcing the order rather than trusting the caller's.
 *
 * Every action reports its selection. A bar of buttons that all do nothing is
 * the same demo-of-nothing as the hardcoded match count: the claim is that
 * choosing an action does something, and that has to be falsifiable here.
 */
function ActionBarDemo(): React.ReactElement {
  const choose = (label: string) => () => toast({ title: `${label} chosen` });
  return (
    <ActionBar
      label="Server actions"
      actions={[
        { label: "Delete", tone: "destructive", onSelect: choose("Delete") },
        { label: "Rename", tone: "default", onSelect: choose("Rename") },
        { label: "Edit", tone: "primary", onSelect: choose("Edit") },
        { label: "Restart", onSelect: choose("Restart") },
        { label: "Snapshot", onSelect: choose("Snapshot") },
        { label: "Move to region", onSelect: choose("Move to region") },
        { label: "View logs", onSelect: choose("View logs") },
      ]}
    />
  );
}

/**
 * The save cycle, with every state reachable and each transition honest.
 *
 * `saving` is the state worth seeing: Discard is disabled, so a click during an
 * in-flight request cannot discard something the request is about to write back.
 *
 * **Save now advances the cycle instead of returning to `dirty`.** It used to
 * `setState("dirty")`, which meant pressing Save took a bar from *unsaved
 * changes* straight back to *unsaved changes* — the button's only visible effect
 * was that nothing happened. And the `NEXT` map had `saved: "error"`, so the
 * "Next state" button turned a successful save into a failure, which is not a
 * transition any real save can make: the request that produced `saved` resolved.
 * A failure is what happens when a *different* request is in flight, so `error`
 * is now entered from `dirty` — the state a user is actually in when they press
 * Save and it goes wrong.
 *
 * `NEXT` is a map rather than an array walked by index. Indexing into a list is
 * `SaveBarState | undefined` under `noUncheckedIndexedAccess`, and the fix for
 * that is a non-null assertion or a fallback that can never be reached — both
 * of which lie about the type. Keyed by state, the next step is total.
 */
const SAVE_STATES: readonly SaveBarState[] = ["idle", "dirty", "saving", "saved", "error"];

const NEXT: Record<SaveBarState, SaveBarState> = {
  idle: "dirty",
  dirty: "saving",
  saving: "saved",
  saved: "dirty",
  error: "idle",
};

function SaveBarDemo(): React.ReactElement {
  const [state, setState] = React.useState<SaveBarState>("idle");

  /** Save begins the request; the stepper below plays the part of the request. */
  const save = () => setState("saving");

  return (
    <Stack gap="lg">
      <SaveBar
        state={state}
        error={state === "error" ? "Port 443 is blocked by the firewall" : undefined}
        onSave={save}
        onDiscard={() => setState("idle")}
      />
      <Stack gap="sm">
        <Text tone="muted" size="ui">
          Current state: <InlineCode>{state}</InlineCode>
        </Text>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setState(NEXT[state])}>
            Next state
          </Button>
          {SAVE_STATES.map((candidate) => (
            <Button
              key={candidate}
              variant={candidate === state ? "primary" : "ghost"}
              // `aria-pressed`: this is a jump to a named state, so the current
              // one has to be announced rather than inferred from a colour.
              aria-pressed={candidate === state}
              onClick={() => setState(candidate)}
            >
              {candidate}
            </Button>
          ))}
        </div>
      </Stack>
    </Stack>
  );
}

/** The section shown when the URL names none, or names one that cannot be shown. */
const DEFAULT_SECTION = "profile";

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: DEFAULT_SECTION,
    label: "Profile",
    description: "How this server is named in the interface.",
    children: (
      <Stack gap="ui">
        <Field>
          <FieldLabel>Display name</FieldLabel>
          <Input defaultValue="api-01" />
          <FieldDescription>Shown in lists and alerts.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Owner team</FieldLabel>
          <Input defaultValue="platform" />
        </Field>
      </Stack>
    ),
  },
  {
    id: "notifications",
    label: "Notifications",
    badge: <Badge tone="caution">2</Badge>,
    children: (
      <Stack gap="ui">
        <Field>
          <FieldLabel>Alert on degraded state</FieldLabel>
          <Input defaultValue="yes" />
          <FieldDescription>A degraded server pages the on-call rotation.</FieldDescription>
        </Field>
      </Stack>
    ),
  },
  {
    id: "sso",
    label: "Single sign-on",
    disabled: true,
    disabledReason: "Requires a plan with SAML support",
    children: <Text tone="muted">Unavailable on this plan.</Text>,
  },
];

/**
 * A whole settings page, composed rather than styled.
 *
 * Every region here is a TEA UI component — `PageHeader`, `SectionNavigation`,
 * `Panel`, `SaveBar` — and this file contributes the section list and two bits of
 * state. That is the layer boundary working: there is no recipe for a settings
 * page in this Showcase, and if the template needed one, the test that reads its
 * source would fail on the design token it found.
 *
 * **The active section lives in the URL**, as `?section=notifications`, which is
 * `URL_SYNC.inUrl`'s `tab`/`selection` pair applied to a settings rail. The
 * template is untouched by this: it still takes `activeSection` and reports
 * `onSectionChange`, and its own doc comment is right that the router owns which
 * section is current. The *router* here is the hash, so the demo is the layer
 * that holds it, and a link to `#/patterns?section=sso` opens on the SSO
 * section rather than on whatever the last visitor happened to click.
 *
 * **The failure is reachable, and the timer is cleaned up.** `error` was passed
 * unconditionally while no code path could ever produce the `error` *state*, so
 * the prop described an affordance the demo could not have: a real page that
 * always showed a firewall error and could never actually fail. The `simulate`
 * switch below makes the failure a real outcome of a real save, and the timer is
 * cleared on unmount — a `setTimeout` that fires after the component is gone is
 * a state update on a dead tree, which in React 18+ is a silent leak and a lie
 * about what the page did.
 */
function SettingsTemplateDemo(): React.ReactElement {
  const [params, setParams] = useHashQuery();
  const [saveState, setSaveState] = React.useState<SaveBarState>("idle");
  const [failNextSave, setFailNextSave] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * Read the requested section through the section list rather than trusting the
   * URL. A hand-edited or stale link can name a section that does not exist, and
   * it can name a *disabled* one — so `find` over the list is what keeps
   * `#/patterns?section=nope` and `#/patterns?section=sso` from rendering a
   * panel the user was told they could not have.
   *
   * `DEFAULT_SECTION` rather than `SETTINGS_SECTIONS[0]!.id`: indexing a list
   * under `noUncheckedIndexedAccess` is `SettingsSection | undefined`, and the
   * two fixes for that — a non-null assertion, or a fallback that can never be
   * reached — both lie about the type.
   */
  const requested = params.get("section");
  const section =
    SETTINGS_SECTIONS.find((entry) => entry.id === requested && !entry.disabled)?.id ??
    DEFAULT_SECTION;

  const selectSection = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("section", id);
    setParams(next);
  };

  // Cleared on unmount, and before every new save, so a stale request cannot
  // resolve over a newer one and report a result that is no longer current.
  React.useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const save = () => {
    setSaveState("saving");
    if (timer.current !== null) clearTimeout(timer.current);
    // A real product awaits the request and picks `error` or `saved` from what
    // came back. The Showcase fakes the wait so the states can be seen — and
    // fakes the outcome too, because a demo whose only possible outcome is
    // success cannot show the failure the component is built around.
    timer.current = setTimeout(() => {
      timer.current = null;
      setSaveState(failNextSave ? "error" : "saved");
    }, 900);
  };

  return (
    <Stack gap="lg">
      <SettingsTemplate
        title="Server settings"
        description="Changes apply to the next deployment."
        sections={SETTINGS_SECTIONS}
        activeSection={section}
        onSectionChange={selectSection}
        saveState={saveState}
        onSave={save}
        onDiscard={() => setSaveState("idle")}
        // Only in the state that has a cause to report. The prop is the text the
        // user acts on, and a string shown beside a bar that is not failing is
        // noise that reads as a stale message.
        error={saveState === "error" ? "Port 443 is blocked by the firewall" : undefined}
        railLabel="Server settings sections"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => setSaveState("dirty")}>
          Mark as changed
        </Button>
        <Button
          variant="outline"
          aria-pressed={failNextSave}
          onClick={() => setFailNextSave((previous) => !previous)}
        >
          {failNextSave ? "Next save fails" : "Simulate a failed save"}
        </Button>
      </div>
      <Text tone="subtle" size="micro">
        <InlineCode>#/patterns?section={section}</InlineCode> — the rail selection is a link, so it can be
        shared and restored.
      </Text>
    </Stack>
  );
}

/**
 * Patterns and templates, with the behaviours running.
 *
 * These four demos are the reason the packages are not just registries. A
 * registry of names is a claim; a bar that refuses to discard while a request is
 * in flight is evidence. The demos are therefore interactive where the contract
 * is about state, because a static screenshot cannot show a `saving` state
 * disabling anything.
 */
export function PatternsSection(): React.ReactElement {
  return (
    <Section
      eyebrow="Patterns"
      title="Compositions that own an interaction"
      lead="A pattern is not a component. It arranges components and decides how they behave together, so the arrangement stops being rebuilt in every product."
    >
      <Stack gap="xl">
        <Panel title="FilterBar" level={3} description="The count stays in the bar, and Reset is bound to the filter.">
          <FilterBarDemo />
        </Panel>

        <Panel
          title="ActionBar"
          level={3}
          description="Seven actions. Primary left, destructive right, overflow past five."
        >
          <ActionBarDemo />
        </Panel>

        <Panel title="SaveBar" level={3} description="The cycle a form actually goes through, including the failure.">
          <SaveBarDemo />
        </Panel>

        <Panel
          title="SettingsTemplate"
          level={3}
          description="A complete page, assembled from the layers below it."
        >
          <SettingsTemplateDemo />
        </Panel>
      </Stack>
    </Section>
  );
}

/* --- desktop shell --------------------------------------------------------- */

/**
 * What a product writes to develop its desktop UI in a browser tab: the same
 * `DesktopShell`, with the window operations stubbed out.
 *
 * That is possible *because* the shell takes the window as a prop. Nothing in
 * `admin` imports `@tauri-apps/api`, so this file compiles with no Tauri
 * toolchain and no Rust side — which is the whole reason the API is injected
 * rather than imported. In a real window these three lines become
 * `getCurrentWindow().minimize()` and friends.
 */
function DesktopShellDemo(): React.ReactElement {
  const [platform, setPlatform] = React.useState<DesktopPlatform>("windows");
  const [maximized, setMaximized] = React.useState(false);
  const [action, setAction] = React.useState<string>("none yet");

  const hostWindow = React.useMemo<DesktopWindow>(
    () => ({
      minimize: () => setAction("minimize"),
      toggleMaximize: () => setAction("toggleMaximize"),
      close: () => setAction("close"),
      isMaximized: () => maximized,
      onMaximizeChange: () => () => {},
    }),
    [maximized],
  );

  return (
    <Stack gap="lg">
      <Stack gap="sm">
<ToggleGroup
          type="single"
          value={platform}
          onValueChange={(next: string) => {
            // Radix reports `""` when the pressed item is released, and the
            // platform is not optional — same reasoning as the theme switcher.
            if (!next) return;
            setPlatform(next as DesktopPlatform);
            setMaximized(false);
          }}
          aria-label="Window platform"
          selection="outline"
          indicator
          className="w-fit"
        >
          {(["windows", "linux", "macos"] as const).map((entry) => (
            <ToggleGroupItem key={entry} value={entry} className="px-4 capitalize">
              {entry}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Text size="ui" tone="muted">
          {platform === "macos"
            ? "macOS draws the traffic lights itself. The shell reserves the leading edge and renders no controls of its own — two sets of window controls is the defect, not the fix."
            : "Three controls, close rightmost, and every one of them outside the drag region so a press presses instead of dragging the window."}
        </Text>
      </Stack>

      {/*
        * `h-[34rem]` overrides the shell's `h-dvh` through tailwind-merge, so the
        * window can be reviewed inside a page. In a real window there is nothing
        * to override — the shell fills the window, which is the point of it.
        */}
      <div className="overflow-hidden border border-line-strong">
        <DesktopShell
          className="h-[34rem]"
          product="MLHSM"
          tagline="Home Server Manager"
          platform={platform}
          window={hostWindow}
          nav={DEMO_NAV}
          activeId="desktop-overview"
          onNavigate={() => {}}
          status={<StatusBadge domain="health" status="online" />}
          actions={
            <Button size="sm" variant="outline">
              Deploy
            </Button>
          }
        >
          <div className="p-ui">
            <Stack gap="md">
              <Heading level={2}>One band, not two</Heading>
              <Text size="ui" tone="muted">
                The brand, the page actions and the window controls share a single strip that
                doubles as the drag region. There is no second header above the navigation, and
                the shell scrolls inside the window rather than the window scrolling.
              </Text>
              <Text size="ui" tone="muted">
                Last window call:{" "}
                <InlineCode>{action === "none yet" ? "—" : action}</InlineCode>
              </Text>
            </Stack>
          </div>
        </DesktopShell>
      </div>
    </Stack>
  );
}

/**
 * Desktop shells, reviewable in a browser.
 *
 * A window with `decorations: false` has no title bar of its own, which means
 * the shell has to *be* the title bar. That is a different structure from the
 * browser shell rather than a variant of it, so it ships as its own component
 * with its own section here.
 */
export function DesktopSection(): React.ReactElement {
  return (
    <Section
      eyebrow="Desktop"
      title="A shell for a window, not a tab"
      lead="The same TEA UI in a Tauri window: one draggable band carrying the brand, the page actions and the window controls."
    >
      <Panel
        title="DesktopShell"
        level={3}
        description="The window API arrives as a prop, so this runs in a browser tab, in Electron and in Tauri from one source."
      >
        <DesktopShellDemo />
      </Panel>
    </Section>
  );
}
