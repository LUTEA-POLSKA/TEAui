/**
 * MLHSM — the example application.
 *
 * This is not a mockup. It is a small product built the way a product is built:
 * its own shell, its own navigation, its own screens, its own state, and not one
 * import from the Showcase around it. If TEA UI could not carry a real app, this
 * is where that would show — and a component sitting in a Showcase panel never
 * would, because the panel supplies the padding, the scroll and the frame that
 * the shell is actually responsible for.
 *
 * It runs at `#/app` because it has to live somewhere and the Showcase is the
 * place a reader is already looking. It is written as its own module with its own
 * route table, so promoting it to `apps/mlhsm` — its own dev server, its own
 * deploy — is a move rather than a rewrite. The test of that claim is simple:
 * nothing below imports Showcase chrome.
 */

import * as React from "react";
import {
  Badge,
  Button,
  Callout,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  Meter,
  Panel,
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
  TableSortButton,
  Text,
  toast,
} from "@tea-ui/core";
import {
  DesktopShell,
  EmptyState,
  EmptyStateFiltered,
  MetricCard,
  Page,
  PageHeader,
  RefreshingIndicator,
  RowActions,
  Score,
  StatGrid,
  StatTile,
  type DesktopWindow,
} from "@tea-ui/admin";
import { FilterBar } from "@tea-ui/patterns";
import { SettingsTemplate, type SettingsSection } from "@tea-ui/templates";
import { HardDrive, Network, Server, ShieldCheck } from "@tea-ui/icons";
import type { Tone } from "@tea-ui/tokens";

/* --- the product's data ---------------------------------------------------- */

/**
 * One shape for the whole example, stated once.
 *
 * The Showcase's other sections invent data per demo, which is fine for a single
 * component. An application has one domain, and a screen that disagreed with its
 * sibling about what a machine is would be the bug — not the demo.
 */
interface Machine {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly state: "running" | "degraded" | "stopped";
  /** Percentage, 0-100. */
  readonly cpu: number;
  readonly memoryGb: number;
  readonly memoryTotalGb: number;
  readonly diskGb: number;
  readonly diskTotalGb: number;
  readonly uptimeDays: number;
}

const MACHINES: readonly Machine[] = [
  { id: "srv-01", name: "api-01", role: "API", state: "running", cpu: 34, memoryGb: 6.1, memoryTotalGb: 16, diskGb: 210, diskTotalGb: 512, uptimeDays: 41 },
  { id: "srv-02", name: "api-02", role: "API", state: "degraded", cpu: 88, memoryGb: 14.2, memoryTotalGb: 16, diskGb: 468, diskTotalGb: 512, uptimeDays: 12 },
  { id: "srv-03", name: "worker-01", role: "Worker", state: "running", cpu: 12, memoryGb: 2.4, memoryTotalGb: 8, diskGb: 88, diskTotalGb: 256, uptimeDays: 41 },
  { id: "srv-04", name: "worker-02", role: "Worker", state: "stopped", cpu: 0, memoryGb: 0, memoryTotalGb: 8, diskGb: 61, diskTotalGb: 256, uptimeDays: 0 },
  { id: "db-01", name: "db-01", role: "Database", state: "running", cpu: 47, memoryGb: 24.8, memoryTotalGb: 32, diskGb: 812, diskTotalGb: 1024, uptimeDays: 96 },
];

const VOLUMES = [
  { id: "vol-backups", label: "Backups", usedGb: 812, totalGb: 1024, trend: "+18 GB this week" },
  { id: "vol-media", label: "Media", usedGb: 240, totalGb: 512, trend: "+4 GB this week" },
  { id: "vol-logs", label: "Logs", usedGb: 61, totalGb: 128, trend: "Rotated 2 h ago" },
] as const;

const gb = (value: number): string => `${value.toFixed(value < 10 ? 1 : 0)} GB`;
const percent = (used: number, total: number): number => Math.round((used / total) * 100);

/**
 * One threshold ladder, used by every meter in the app.
 *
 * Two screens show utilisation, and each deciding its own cut-offs is how a
 * product ends up with 90 % critical on one page and 80 % on another. The same
 * reasoning as the one shared tone per state, one level down.
 */
const UTILISATION = [
  { at: 90, tone: "critical" },
  { at: 75, tone: "caution" },
  { at: 0, tone: "positive" },
] as const satisfies readonly { at: number; tone: Tone }[];

/* --- shared pieces --------------------------------------------------------- */

/**
 * The tone and the registry status for a machine's state, in one place.
 *
 * The badge reads its word from `@tea-ui/ux-standards` and its colour from the
 * same entry, so "Degraded" can never be drawn in the tone of "Offline".
 */
function machineStatus(state: Machine["state"]): "online" | "degraded" | "offline" {
  return state === "running" ? "online" : state === "degraded" ? "degraded" : "offline";
}

function stateTone(state: Machine["state"]): Tone {
  return state === "running" ? "positive" : state === "degraded" ? "caution" : "neutral";
}

function StateBadge({ state }: { state: Machine["state"] }): React.ReactElement {
  return <StatusBadge domain="health" status={machineStatus(state)} />;
}

/* --- screen: overview ------------------------------------------------------ */

function OverviewScreen(): React.ReactElement {
  const running = MACHINES.filter((machine) => machine.state === "running").length;
  const attention = MACHINES.filter((machine) => machine.state !== "running");
  const usedMemory = MACHINES.reduce((sum, m) => sum + m.memoryGb, 0);
  const totalMemory = MACHINES.reduce((sum, m) => sum + m.memoryTotalGb, 0);
  const usedDisk = VOLUMES.reduce((sum, v) => sum + v.usedGb, 0);
  const totalDisk = VOLUMES.reduce((sum, v) => sum + v.totalGb, 0);
  const memoryPercent = percent(usedMemory, totalMemory);
  const diskPercent = percent(usedDisk, totalDisk);

  return (
    <Page>
      <PageHeader
        title="Overview"
        description="Every machine this console knows about, and what it needs."
        actions={<RefreshingIndicator />}
      />

      <Stack gap="lg">
        <StatGrid>
          <StatTile
            label="Machines online"
            value={`${running} of ${MACHINES.length}`}
            hint={attention.length === 0 ? "Nothing needs you" : `${attention.length} need attention`}
            tone={attention.length === 0 ? "positive" : "caution"}
          />
          <StatTile
            label="Memory in use"
            value={gb(usedMemory)}
            hint={`of ${gb(totalMemory)}`}
            trend={memoryPercent > 75 ? "up" : "flat"}
            trendValue={`${memoryPercent} %`}
          />
          <StatTile
            label="Storage in use"
            value={gb(usedDisk)}
            hint={`of ${gb(totalDisk)}`}
            trend={diskPercent > 75 ? "up" : "flat"}
            trendValue={`${diskPercent} %`}
          />
          <StatTile
            label="Needs attention"
            value={String(attention.length)}
            hint={attention.map((m) => m.name).join(", ") || "—"}
            tone={attention.length === 0 ? "positive" : "critical"}
          />
        </StatGrid>

        <div className="grid gap-lg lg:grid-cols-2">
          <Panel title="Memory per machine" level={2} description="Each measured against its own total.">
            <Stack gap="lg">
              {MACHINES.filter((machine) => machine.state !== "stopped").map((machine) => (
                <Meter
                  key={machine.id}
                  label={`${machine.name} memory`}
                  value={machine.memoryGb}
                  max={machine.memoryTotalGb}
                  valueText={`${gb(machine.memoryGb)} of ${gb(machine.memoryTotalGb)} used`}
                  thresholds={UTILISATION}
                  showThresholds
                />
              ))}
            </Stack>
          </Panel>

          <Stack gap="lg">
            <Panel title="What needs you" level={2} description="A cause and a next step, not a state.">
              {attention.length === 0 ? (
                <EmptyState title="Nothing needs attention" description="Every machine is inside its limits." />
              ) : (
                <Stack gap="sm">
                  {attention.map((machine) => (
                    <Callout key={machine.id} tone={stateTone(machine.state)}>
                      <span className="font-medium">{machine.name}</span>{" "}
                      {machine.state === "degraded"
                        ? `is at ${machine.cpu} % CPU and ${percent(machine.memoryGb, machine.memoryTotalGb)} % memory. Restarting it is usually enough.`
                        : "has been stopped. Starting it will rejoin the pool."}
                    </Callout>
                  ))}
                </Stack>
              )}
            </Panel>

            <Panel title="Health score" level={2} description="Weighted across every reading above.">
              <Score value={78} label="Fleet health" caption="Across 5 machines" />
            </Panel>
          </Stack>
        </div>
      </Stack>
    </Page>
  );
}

/* --- screen: servers ------------------------------------------------------- */

type SortKey = "name" | "cpu";

function ServersScreen(): React.ReactElement {
  const [query, setQuery] = React.useState("");
  const [onlyRunning, setOnlyRunning] = React.useState(false);
  const [sort, setSort] = React.useState<SortKey>("cpu");

  const filtering = query !== "" || onlyRunning;
  const clear = () => {
    setQuery("");
    setOnlyRunning(false);
  };

  const matches = MACHINES.filter((machine) => {
    if (onlyRunning && machine.state !== "running") return false;
    if (!query) return true;
    return `${machine.name} ${machine.role}`.toLowerCase().includes(query.toLowerCase());
  }).sort((a, b) => (sort === "cpu" ? b.cpu - a.cpu : a.name.localeCompare(b.name)));

  return (
    <Page>
      <PageHeader
        title="Servers"
        description="Five machines, one table. Every row answers the same three questions."
      />

      <Stack gap="lg">
        {/*
          * The pattern, not a hand-rolled filter row. The count belongs beside the
          * filter rather than inside an empty state, and Reset belongs to the
          * filter rather than to the table below it.
          */}
        <FilterBar
          label="Filter servers"
          matchCount={matches.length}
          totalCount={MACHINES.length}
          active={filtering}
          onReset={clear}
        >
          <SearchInput
            label="Search machines"
            placeholder="Search name or role"
            value={query}
            onValueChange={setQuery}
          />
          <Button variant={onlyRunning ? "primary" : "outline"} onClick={() => setOnlyRunning((p) => !p)}>
            Running only
          </Button>
        </FilterBar>

        {matches.length === 0 ? (
          <EmptyStateFiltered
            noun="machine"
            action={<Button onClick={clear}>Clear the filter</Button>}
          />
        ) : (
          <Table label="Machines" stickyHeader>
            <TableCaption>
              {matches.length} of {MACHINES.length} machines
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {/*
                    * `TableSortButton`, not a hand-written `<button>` in a head.
                    * The component exists to put `aria-sort` on the *head* and a
                    * glyph that matches the direction, and a bespoke button gets
                    * the glyph right and the announcement wrong.
                    */}
                  <TableSortButton
                    direction={sort === "name" ? "ascending" : "none"}
                    active={sort === "name"}
                    onClick={() => setSort("name")}
                  >
                    Machine
                  </TableSortButton>
                </TableHead>
                <TableHead>State</TableHead>
                <TableHead>
                  <TableSortButton
                    direction={sort === "cpu" ? "descending" : "none"}
                    active={sort === "cpu"}
                    onClick={() => setSort("cpu")}
                  >
                    CPU
                  </TableSortButton>
                </TableHead>
                <TableHead>Memory</TableHead>
                <TableHead>Disk</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((machine) => (
                <TableRow key={machine.id}>
                  <TableCell>
                    <span className="block font-medium text-fg">{machine.name}</span>
                    <span className="block text-micro text-fg-muted">{machine.role}</span>
                  </TableCell>
                  <TableCell>
                    <StateBadge state={machine.state} />
                  </TableCell>
                  <TableCell>{machine.state === "stopped" ? "—" : `${machine.cpu} %`}</TableCell>
                  <TableCell>{gb(machine.memoryGb)}</TableCell>
                  <TableCell>
                    {gb(machine.diskGb)}
                    <span className="text-fg-muted"> / {gb(machine.diskTotalGb)}</span>
                  </TableCell>
                  <TableCell>{machine.uptimeDays === 0 ? "—" : `${machine.uptimeDays} d`}</TableCell>
                  <TableCell>
                    {/*
                      * One visible action, the rest in the menu. Two visible
                      * actions in one cell is what `RowActions` exists to end, and
                      * `Restart` is the one a row is usually opened for.
                      */}
                    <RowActions
                      overflowLabel={`Actions for ${machine.name}`}
                      primary={{
                        label: "Restart",
                        onSelect: () => toast({ title: `Restarting ${machine.name}` }),
                      }}
                      items={[
                        { label: "Console", onSelect: () => toast({ title: `Console for ${machine.name}` }) },
                        { label: "Reboot", onSelect: () => toast({ title: `Rebooting ${machine.name}` }) },
                        {
                          label: "Remove",
                          variant: "destructive",
                          onSelect: () => toast({ title: `Removing ${machine.name}`, tone: "critical" }),
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Stack>
    </Page>
  );
}

/* --- screen: storage ------------------------------------------------------- */

function StorageScreen(): React.ReactElement {
  return (
    <Page>
      <PageHeader
        title="Storage"
        description="Three volumes. Each says how full it is before it says anything is wrong."
      />
      <Stack gap="lg">
        <StatGrid>
          {VOLUMES.map((volume) => {
            const used = percent(volume.usedGb, volume.totalGb);
            return (
              <MetricCard
                key={volume.id}
                label={volume.label}
                value={gb(volume.usedGb)}
                hint={`of ${gb(volume.totalGb)} · ${volume.trend}`}
                percent={used}
                tone={used > 85 ? "critical" : used > 70 ? "caution" : "positive"}
              />
            );
          })}
        </StatGrid>

        <Panel title="Per volume" level={2} description="The threshold is visible, not implied.">
          <Stack gap="lg">
            {VOLUMES.map((volume) => (
              <Meter
                key={volume.id}
                label={`${volume.label} usage`}
                value={volume.usedGb}
                max={volume.totalGb}
                valueText={`${gb(volume.usedGb)} of ${gb(volume.totalGb)} used`}
                thresholds={UTILISATION}
                showThresholds
              />
            ))}
          </Stack>
        </Panel>

        <Callout tone="caution" title="Backups will fail on Sunday">
          <span>
            Backups are at 79 % and the weekly job needs roughly 40 GB. At the current rate the
            volume is full before the job can finish. Pruning archives older than 90 days frees
            about 120 GB.
          </span>
        </Callout>
      </Stack>
    </Page>
  );
}

/* --- screen: settings ------------------------------------------------------ */

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

function SettingsScreen(): React.ReactElement {
  const [section, setSection] = React.useState("fleet");
  const [saveState, setSaveState] = React.useState<SaveState>("idle");

  const sections: SettingsSection[] = [
    {
      id: "fleet",
      label: "Fleet",
      description: "How machines are discovered and named.",
      children: (
        <Stack gap="ui">
          <Field>
            <FieldLabel>Console name</FieldLabel>
            <Input defaultValue="Home" />
            <FieldDescription>Shown in the window title and in every notification.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Discovery range</FieldLabel>
            <Input defaultValue="192.168.1.0/24" />
          </Field>
        </Stack>
      ),
    },
    {
      id: "alerts",
      label: "Alerts",
      badge: <Badge tone="caution">2</Badge>,
      description: "Who is told, and how often.",
      children: (
        <Stack gap="ui">
          <Field>
            <FieldLabel>CPU threshold</FieldLabel>
            <Input defaultValue="85 %" />
            <FieldDescription>A machine above this for five minutes pages the on-call rotation.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Storage threshold</FieldLabel>
            <Input defaultValue="90 %" />
          </Field>
        </Stack>
      ),
    },
    {
      id: "updates",
      label: "Updates",
      description: "When machines are patched.",
      children: (
        <Stack gap="ui">
          <Field>
            <FieldLabel>Window</FieldLabel>
            <Input defaultValue="Sunday 03:00 – 05:00" />
          </Field>
        </Stack>
      ),
    },
    {
      id: "sso",
      label: "Single sign-on",
      disabled: true,
      disabledReason: "Available from the Business plan",
      children: <Text tone="muted">Not part of this plan.</Text>,
    },
  ];

  const save = () => {
    setSaveState("saving");
    /*
     * A real console awaits the request and picks `saved` or `error` from what came
     * back. The Showcase fakes the wait so the states are reachable, and the
     * failure is reachable from the button beside it — a demo whose error path
     * cannot be entered proves nothing about the error.
     */
    setTimeout(() => setSaveState("saved"), 700);
  };

  return (
    <SettingsTemplate
      title="Settings"
      description="Applies to the next deployment."
      sections={sections}
      activeSection={section}
      onSectionChange={setSection}
      saveState={saveState}
      onSave={save}
      onDiscard={() => setSaveState("idle")}
      error="The console could not reach the config store"
      railLabel="Settings sections"
      headerActions={
        <Button variant="outline" size="sm" onClick={() => setSaveState("dirty")}>
          Mark as changed
        </Button>
      }
    />
  );
}

/* --- the app --------------------------------------------------------------- */

type ScreenId = "overview" | "servers" | "storage" | "settings";

/**
 * A flat route table rather than a router package.
 *
 * Four screens need no nested routes, no params and no loaders, and the
 * alternative is the workspace's first runtime dependency that is neither React
 * nor Radix. The limit is stated rather than hidden: this table does not survive
 * a route like `/servers/:id`, and the day MLHSM has one is the day to add a
 * router — to *this* module, not to TEA UI. The templates deliberately own no
 * routing, and this is where that decision is paid off.
 */
const SCREENS: Record<ScreenId, () => React.ReactElement> = {
  overview: OverviewScreen,
  servers: ServersScreen,
  storage: StorageScreen,
  settings: SettingsScreen,
};

const NAV = [
  { id: "overview", label: "Overview", icon: <Server size={16} aria-hidden="true" />, group: "General" },
  { id: "servers", label: "Servers", icon: <Network size={16} aria-hidden="true" />, meta: String(MACHINES.length), group: "General" },
  { id: "storage", label: "Storage", icon: <HardDrive size={16} aria-hidden="true" />, group: "System" },
  { id: "settings", label: "Settings", icon: <ShieldCheck size={16} aria-hidden="true" />, group: "System" },
] as const;

const DEFAULT_SCREEN: ScreenId = "overview";

export function isScreenId(value: string): value is ScreenId {
  return value in SCREENS;
}

export interface MlhsmAppProps {
  /** Screen to show on first paint. `#/app/servers` lands here. */
  initialScreen?: string;
  /** Reports a screen change so the Showcase can put it in the URL. */
  onScreenChange?: ((screen: ScreenId) => void) | undefined;
  /** Present when a host wants a way out of the app. */
  onExit?: (() => void) | undefined;
}

export function MlhsmApp({
  initialScreen,
  onScreenChange,
  onExit,
}: MlhsmAppProps): React.ReactElement {
  const [screen, setScreen] = React.useState<ScreenId>(
    initialScreen && isScreenId(initialScreen) ? initialScreen : DEFAULT_SCREEN,
  );
  const [windowCall, setWindowCall] = React.useState<string>("");

  const go = React.useCallback(
    (next: string) => {
      if (!isScreenId(next)) return;
      setScreen(next);
      onScreenChange?.(next);
    },
    [onScreenChange],
  );

  /**
   * The window, for development in a browser tab.
   *
   * In a Tauri build these three lines are `getCurrentWindow().minimize()` and
   * friends. Nothing in `@tea-ui/admin` imports `@tauri-apps/api`, which is why
   * this file compiles with no Rust toolchain present, and why the same source
   * ships inside the real window.
   */
  const onWindowCall = React.useCallback((name: string) => setWindowCall(name), []);
  const hostWindow = React.useMemo<DesktopWindow>(
    () => ({
      minimize: () => onWindowCall("minimize"),
      toggleMaximize: () => onWindowCall("toggleMaximize"),
      close: () => onWindowCall("close"),
    }),
    [onWindowCall],
  );

  const Screen = SCREENS[screen];
  const degraded = MACHINES.some((machine) => machine.state === "degraded");

  return (
    <DesktopShell
      product="MLHSM"
      tagline="Home Server Manager"
      /*
       * `windows` because the Showcase runs on the machine reading it. Switching
       * this to `macos` removes the three controls and reserves the leading edge
       * instead, which is the whole reason `platform` is a prop.
       */
      platform="windows"
      window={hostWindow}
      nav={NAV.map((item) => ({ ...item, onSelect: () => go(item.id) }))}
      activeId={screen}
      onNavigate={go}
      status={<StatusBadge domain="health" status={degraded ? "degraded" : "online"} />}
      actions={
        <React.Fragment>
          {windowCall ? (
            <Text size="micro" tone="muted" className="me-2">
              {windowCall} called
            </Text>
          ) : null}
          {onExit ? (
            <Button size="sm" variant="ghost" onClick={onExit}>
              Leave the app
            </Button>
          ) : null}
        </React.Fragment>
      }
    >
      <Screen />
    </DesktopShell>
  );
}