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
  Combobox,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FieldError,
  FieldLabel,
  Heading,
  InlineCode,
  Input,
  List,
  Meter,
  Nav,
  NumberField,
  PanelHeader,
  Panel,
  Preformatted,
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
  ToggleGroup,
  ToggleGroupItem,
  useTableSort,
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
  /*
   * This used to be a hand-written `<table>` with a `min-w-[40rem]` and a
   * `sr-only` caption — the exact shape the audit counted ten of in one product.
   * The documentation is the first thing that should use its own components:
   * if `Table` cannot render an API table, it cannot render anyone's.
   *
   * The overflow region, the caption and the `scope="col"` all come from
   * `Table`, so none of them can be forgotten at a call site.
   */
  return (
    <Table label="API-Referenz">
      <TableCaption>API-Referenz</TableCaption>
      <TableHeader>
        <TableRow>
          {["Prop", "Typ", "Pflicht", "Bedeutung"].map((heading) => (
            <TableHead key={heading}>{heading}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(([prop, type, required, note]) => (
          <TableRow key={prop}>
            <TableCell>
              <InlineCode>{prop}</InlineCode>
            </TableCell>
            <TableCell className="text-fg-muted">
              <InlineCode>{type}</InlineCode>
            </TableCell>
            <TableCell>
              {required ? <Badge tone="positive">ja</Badge> : <span className="text-fg-subtle">nein</span>}
            </TableCell>
            <TableCell className="text-fg-muted">{note}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
            <FieldLabel>E-mail</FieldLabel>
            <Input
              type="email"
              autoComplete="email"
              value={error ? "not-valid" : ""}
              onChange={(event) => setError(event.target.value)}
            />
            {error ? <FieldError>Please enter a valid address.</FieldError> : null}
          </Field>
          <Button onClick={() => setError("x")}>Sign in</Button>
        </Stack>
      </Example>

      <H2>Setting the theme</H2>
      <Lead>
        A theme assigns values to semantic roles. No component changes between themes, and none
        contains a colour.
      </Lead>
      <Preformatted copyable>{`<html data-theme="${THEMES[1]}" data-density="compact">`}</Preformatted>
    </Doc>
  );
}

/* -------------------------------------------------------------------------- */
/* Core                                                                        */
/* -------------------------------------------------------------------------- */

const COMBOBOX_API: ReadonlyArray<[string, string, boolean, string]> = [
  ["label", "string", true, "The accessible name. The search glyph is not a label."],
  ["options", "readonly ComboboxOption[]", true, "value, label and an optional description."],
  ["multiple", "boolean", false, "When true, value is a string[] and onValueChange reports the whole selection."],
  ["value", "string | string[]", false, "The type follows multiple. An array in a single-select group is a type error."],
  ["onValueChange", "(value: string | string[]) => void", false, "In multiple mode the complete selection, not the last value toggled."],
  ["filter", "(option, query) => boolean", false, "The default is NFD folding: typing `cafe` finds `Café Crème`, case-insensitively."],
  ["locale", "string", false, "For the default filter. Without a value the runtime environment is used."],
  ["emptyMessage", "string", false, "When the search finds nothing. English default, overridable."],
  ["clearLabel", "string", false, "The accessible name of the clear button."],
];

const DIALOG_API: ReadonlyArray<[string, string, boolean, string]> = [
  ["open", "boolean", false, "Controlled. Without open, onOpenChange is the only way in."],
  ["onOpenChange", "(open: boolean) => void", false, "Escape, an overlay click and Close all report here."],
  ["fallbackTitle", "string", false, "Applies when no DialogTitle is rendered — otherwise the dialog would have no name."],
  ["showCloseButton", "boolean", false, "Defaults to true."],
  ["closeLabel", "string", false, "The accessible name of the close button."],
];

const TOGGLE_GROUP_API: ReadonlyArray<[string, string, boolean, string]> = [
  ["type", "'single' | 'multiple'", true, "single reports a string, multiple a string[]."],
  ["value", "string | string[]", false, "Controlled."],
  ["onValueChange", "(value: string | string[]) => void", false, "In single mode also an empty string when the active item is deselected."],
  ["selection", "'primary' | 'secondary' | 'outline'", false, "The emphasis of the pressed state. Defaults to primary."],
  ["indicator", "boolean", false, "A surface behind the selected item that travels with it. Opt-in."],
  ["orientation", "'horizontal' | 'vertical'", false, "Decides which arrow keys move the selection."],
  ["label", "string", true, "The accessible name of the group."],
];

const NUMBER_FIELD_API: ReadonlyArray<[string, string, boolean, string]> = [
  ["unit", "string", true, "The scale. 512 without a unit is not an answer."],
  ["min / max", "number", false, "Clamped on blur, not on every keystroke."],
  ["step", "number", false, "For the stepper buttons."],
  ["value / defaultValue", "number", false, "Controlled or uncontrolled, as usual."],
  ["onValueChange", "(value: number) => void", false, "Receives a number. NaN is not reported."],
];

const PANEL_HEADER_API: ReadonlyArray<[string, string, boolean, string]> = [
  ["title", "string", true, "The title."],
  ["level", "1 | 2 | 3 | 4 | 5 | 6", true, "The heading level that is actually rendered."],
  ["description", "string", false, "One sentence underneath."],
  ["actions", "ReactNode", false, "On the end side. At level 1 that is semantically questionable."],
];

const BUTTON_API: Array<[string, string, boolean, string]> = [
  ["variant", "'primary' | 'secondary' | 'outline' | 'ghost' | 'subtle' | 'destructive' | 'link'", false, "The only style axis besides `size`."],
  ["size", "'sm' | 'md' | 'lg' | 'icon-sm' | 'icon-md' | 'icon-lg'", false, "Height comes from the density, not from a fixed value."],
  ["loading", "boolean", false, "Shows a spinner, holds the width, sets `aria-busy` and blocks a repeat."],
  ["asChild", "boolean", false, "Renders the child element instead of a `<button>` — for router links."],
  ["disabled", "boolean", false, "The native state."],
];

function CorePage(): React.ReactElement {
  const [value, setValue] = React.useState("srv-01");
  return (
    <Doc>
      <Heading level={1}>Core</Heading>
      <Lead>
        The layer with no product dependency. Nothing on this page says what a server, a backup
        or a user is.
      </Lead>

      <H2>Button</H2>
      <Example
        title="Variants and states"
        code={`<Button variant="destructive" loading>Save</Button>
<Button asChild><Link href="/docs">Documentation</Link></Button>`}
      >
        <Stack gap="ui">
          <ButtonGroup label="Variants">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </ButtonGroup>
          <ButtonGroup label="States">
            <Button loading>Save</Button>
            <Button disabled>Disabled</Button>
          </ButtonGroup>
        </Stack>
      </Example>
      <ApiTable rows={BUTTON_API} />

      <H2>Field</H2>
      <Lead>
        The most important part of the library. It wires label, description and error structurally
        — which is why a field without an accessible name cannot be built.
      </Lead>
      <Example
        title="Live"
        code={`<Field required invalid={!!error}>
  <FieldLabel>E-mail</FieldLabel>
  <Input type="email" autoComplete="email" />
  <FieldDescription>We send no confirmation.</FieldDescription>
  <FieldError>{error}</FieldError>
</Field>`}
      >
        <div className="max-w-sm">
          <Field required id="doc-field" invalid={value === ""}>
            <FieldLabel>Hostname</FieldLabel>
            <Input value={value} onChange={(event) => setValue(event.target.value)} />
            <FieldDescription>Lowercase letters, numbers and hyphens.</FieldDescription>
            {value === "" ? <FieldError>The hostname must not be empty.</FieldError> : null}
          </Field>
        </div>
      </Example>

      <H2>Status</H2>
      <Lead>
        A state is always rendered through the registry. Never with its own colour, never with its
        own wording.
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

      <H2>States</H2>
      <Lead>
        Every asynchronous surface is in exactly one of seventeen named states. The matching
        indicator is decided, not chosen.
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

      <H2>Combobox</H2>
      <Lead>
        The input <em>is</em> the combobox. Not a wrapper around it: the role and the whole state
        — <InlineCode>aria-expanded</InlineCode>, <InlineCode>aria-activedescendant</InlineCode> —
        hang on the focusable element, because otherwise screen-reader software describes a search
        that does not exist.
      </Lead>
      <Example
        title="Live"
        code={`<Combobox
  label="Select a server"
  options={[
    { value: "srv-01", label: "srv-01" },
    { value: "db-01", label: "db-01" },
  ]}
  value={value}
  onValueChange={setValue}
/>`}
      >
        <div className="max-w-sm">
          <Combobox
            label="Select a server"
            emptyMessage="No matches"
            options={[
              { value: "srv-01", label: "srv-01", description: "12 GiB RAM" },
              { value: "srv-02", label: "srv-02", description: "8 GiB RAM" },
              { value: "db-01", label: "db-01", description: "64 GiB RAM" },
            ]}
            value={value}
            onValueChange={setValue}
          />
        </div>
      </Example>
      <ApiTable rows={COMBOBOX_API} />
      <Text>
        <strong>Multiple selection.</strong> With <InlineCode>multiple</InlineCode>,{" "}
        <InlineCode>value</InlineCode> is a <InlineCode>string[]</InlineCode> and{" "}
        <InlineCode>onValueChange</InlineCode> reports the complete selection. The type does not
        allow an array without <InlineCode>multiple</InlineCode> — that is a type question, not a
        runtime one.
      </Text>

      <H2>Dialog</H2>
      <Lead>
        A dialog needs a name. Without one the component renders a visually hidden title rather
        than staying nameless. The search is recursive, so the obvious composition with{" "}
        <InlineCode>DialogHeader</InlineCode> works as well as a title behind an arbitrary
        wrapper.
      </Lead>
      <Example
        title="Live"
        code={`<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent fallbackTitle="Confirm">
    <DialogHeader>
      <DialogTitle>Discard changes?</DialogTitle>
    </DialogHeader>
    <DialogBody>The operation is aborted.</DialogBody>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="ghost">Cancel</Button>
      </DialogClose>
      <DialogClose asChild>
        <Button variant="destructive">Discard</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>`}
      >
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent fallbackTitle="Confirm">
            <DialogHeader>
              <DialogTitle>Discard changes?</DialogTitle>
            </DialogHeader>
            <DialogBody>The operation is aborted and nothing is saved.</DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive">Discard</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Example>
      <ApiTable rows={DIALOG_API} />
      <Text>
        <strong>DialogClose is a bare button.</strong> It carries no variant and no class — the
        intent comes from <InlineCode>asChild</InlineCode> and a <InlineCode>Button</InlineCode>.
        That is why <InlineCode>&lt;DialogClose variant=…&gt;</InlineCode> is not valid TEA UI, and
        the example shows the composition that is.
      </Text>

      <H2>ToggleGroup</H2>
      <Lead>
        A segmented selection, not a stack of buttons. <InlineCode>radiogroup</InlineCode> promises
        that the arrow keys move focus <em>and</em> selection together — Radix announces the role
        and ships button semantics, so this component adds the behaviour.
      </Lead>
      <Example
        title="Live"
        code={`<ToggleGroup type="single" value={value} onValueChange={setValue} selection="outline" indicator>
  <ToggleGroupItem value="srv-01">srv-01</ToggleGroupItem>
  <ToggleGroupItem value="db-01">db-01</ToggleGroupItem>
</ToggleGroup>`}
      >
        <div className="space-y-2">
          <ToggleGroup
            type="single"
            label="Server"
            value={value}
            onValueChange={setValue}
            selection="outline"
            indicator
          >
            <ToggleGroupItem value="srv-01">srv-01</ToggleGroupItem>
            <ToggleGroupItem value="srv-02">srv-02</ToggleGroupItem>
            <ToggleGroupItem value="db-01">db-01</ToggleGroupItem>
          </ToggleGroup>
          <Text className="text-micro text-fg-muted">
            <InlineCode>selection="outline"</InlineCode> means: not a second colour, but the
            neutral surface of the secondary button.{" "}
            <InlineCode>indicator</InlineCode> switches the travelling surface on.
          </Text>
        </div>
      </Example>
      <ApiTable rows={TOGGLE_GROUP_API} />
      <Text>
        <strong>Keyboard.</strong> <InlineCode>ArrowLeft</InlineCode>,{" "}
        <InlineCode>ArrowRight</InlineCode>, <InlineCode>Home</InlineCode> and{" "}
        <InlineCode>End</InlineCode> change the value. The cross-axis is left to{" "}
        <InlineCode>orientation</InlineCode>, so it cannot fight the prop.
      </Text>

      <H2>NumberField</H2>
      <Lead>
        Numeric input with a unit. Clamping to the range happens on blur, not on every keystroke —
        a field that clamps while you type cannot be used to enter a number at all.
      </Lead>
      <Example
        title="Live"
        code={`<NumberField unit="GiB" min={0} defaultValue={512} />`}
      >
        <div className="max-w-xs">
          <NumberField unit="GiB" min={0} defaultValue={512} />
        </div>
      </Example>
      <ApiTable rows={NUMBER_FIELD_API} />

      <H2>PanelHeader</H2>
      <Lead>
        A section header that renders a real heading. The level is a required argument, because a
        header that always renders an h2 breaks the document outline as soon as it sits inside a
        dialog.
      </Lead>
      <Example
        title="Live"
        code={`<PanelHeader title="Memory" level={2} description="Used by 15 instances." actions={<Button size="sm">Release</Button>} />`}
      >
        <div className="border border-line">
          <PanelHeader
            title="Memory"
            level={2}
            description="Used by 15 instances."
          />
        </div>
      </Example>
      <ApiTable rows={PANEL_HEADER_API} />
    </Doc>
  );
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                       */
/* -------------------------------------------------------------------------- */

const ADMIN_NAV: NavItem[] = [
  { id: "overview", label: "Overview", group: "General" },
  { id: "server", label: "Servers", group: "General" },
];

function AdminPage(): React.ReactElement {
  return (
    <Doc>
      <Heading level={1}>Admin</Heading>
      <Lead>
        The information-dense layer: built for scanning and for keyboard workflows. Everything
        composes Core, and nothing knows an API.
      </Lead>

      <H2>Application Shell</H2>
      <Lead>
        Below 1024px the sidebar becomes a drawer, and a skip link is the first focusable element.
        Both are properties of the shell rather than something each surface reinvents.
      </Lead>
      <div className="overflow-hidden border border-line">
        <AdminShell
          product="TEA Demo"
          nav={ADMIN_NAV}
          activeId="overview"
          actions={<Button size="sm" variant="outline">Action</Button>}
        >
          <div className="p-4">
            <Text size="ui">The page content goes here.</Text>
          </div>
        </AdminShell>
      </div>

      <H2>StatTile</H2>
      <Lead>
        The value is the subject, so it leads and it is the largest type size. Colour is a{" "}
        <InlineCode>tone</InlineCode> and never the only signal.
      </Lead>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Servers online" value="12" tone="positive" trend="up" trendValue="+2" />
        <StatTile label="CPU load" value="47 %" tone="info" trend="down" trendValue="−6 %" />
        <StatTile label="Storage" value="412 GiB" tone="caution" hint="of 1 TiB" />
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
        Public UI is not admin UI in other colours. The difference is structural: measure, type
        size, rhythm and conversion.
      </Lead>

      <div className="overflow-hidden border border-line">
        <Section spacing="normal">
          <Hero
            eyebrow="Example"
            title="A headline you understand in five seconds"
            lead="Body copy runs to a maximum of three columns wide. A 120-character line is not readable — and marketing pages are reading pages."
            actions={
              <>
                <Button>Get started</Button>
                <Button variant="outline">Documentation</Button>
              </>
            }
          />
          <Section bordered>
            <FeatureGrid>
              <Feature title="Fast" description="No setup, no configuration." proof="Running in 30 seconds" />
              <Feature title="Clear" description="One structure you learn once." proof="One navigation model" />
              <Feature title="Accessible" description="WCAG 2.2 AA, checked in the build." proof="64 contrast measurements" />
            </FeatureGrid>
          </Section>
        </Section>
      </div>

      <H2>Pricing</H2>
      <PricingTable
        tiers={[
          { name: "Base", price: "0 €", period: "forever", features: ["1 project", "Community support"], action: <Button variant="outline" size="sm">Choose</Button> },
          { name: "Team", price: "29 €", period: "per month", description: "For small teams.", features: ["Unlimited projects", "Priority support"], highlighted: true, action: <Button size="sm">Choose</Button> },
          { name: "Company", price: "On request", features: ["SLA", "Dedicated instance"], action: <Button variant="ghost" size="sm">Contact</Button> },
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
        Standards nobody reads are not standards. So they ship as code: a status vocabulary, a
        destructiveness matrix, a form behaviour — and a component cannot route around them by
        accident.
      </Lead>

      <H2>Cross-Product Consistency</H2>
      <Alert tone="info">
        <AlertTitle>The one rule</AlertTitle>
        Two surfaces solving the same interaction problem behave the same way — unless the
        difference is written down.
      </Alert>

      <H2>Navigation</H2>
      <Lead>The question decides the pattern. This table is the decision.</Lead>
      <div className="flex flex-col gap-3">
        {NAVIGATION_RULES.map((rule) => (
          <Card key={rule.situation}>
            <CardHeader>
              <CardTitle level={4}>{rule.use}</CardTitle>
            </CardHeader>
            <CardBody>
              <Text size="ui">{rule.situation}</Text>
              <Text size="micro" tone="muted" className="mt-1">
                <strong className="text-fg">Not:</strong> {rule.avoid} — {rule.rationale}
              </Text>
            </CardBody>
          </Card>
        ))}
      </div>

      <H2>Destructive actions</H2>
      <Lead>
        The weakest protection that suffices for the consequence. Every unnecessary confirmation
        dialog is a dialog the user will learn to dismiss next time — including the one they
        needed to read.
      </Lead>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["reversible", "Undo", "Ask nothing. Offer undo."],
          ["recoverable", "Confirm", "Name the consequence. Cancel takes the focus."],
          ["irreversible", "Confirm and type", "Name the consequence. Make them type the name."],
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
        <AlertTitle>Never destructive as the primary button</AlertTitle>
        Destruction is usually the most visually prominent action in a row. The resistance belongs
        on the destructive path, not on the reversible one.
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
      <Heading level={1}>Architecture</Heading>
      <Lead>
        Dependencies point downwards only. Every edge is checked in CI; an import upwards is an
        error, not a style.
      </Lead>

      <H2>Packages</H2>
      <ApiTable
        rows={[
          ["@tea-ui/utils", "Package", true, "Class merging, variants, prefixing."],
          ["@tea-ui/tokens", "Package", true, "Roles, themes, density, motion, breakpoints."],
          ["@tea-ui/ux-standards", "Package", true, "Status registry, tones, states, terminology."],
          ["@tea-ui/icons", "Package", true, "A curated icon set."],
          ["@tea-ui/core", "Package", true, "Primitives, free of product dependencies."],
          ["@tea-ui/admin", "Package", true, "Shell, metrics, data states."],
          ["@tea-ui/public", "Package", true, "Marketing, site, content, conversion."],
        ]}
      />

      <H2>Why exactly one stylesheet</H2>
      <Lead>
        9.7 kB gzip for the whole system. Every package exports that same file as{" "}
        <InlineCode>&lt;pkg&gt;/styles.css</InlineCode>, so an application imports it exactly once
        and no component can ship CSS that deviates from the system.
      </Lead>

      <H2>Tree-shaking, measured</H2>
      <Lead>
        Not claimed but measured — with <InlineCode>npm run check:tree</InlineCode>. A single
        component costs 13.2 % of the package. Before this decision it was 93.4 %, because bundling
        the
        <InlineCode>createContext()</InlineCode> calls of every component into a single
        level.
      </Lead>

      <H2>Versioning</H2>
      <List>
        <li>Public APIs are contracts. A break needs a major version, a migration note and a changelog entry.</li>
        <li>Every change gets a changeset with a rationale.</li>
        <li>A release comes out of a merged changeset, never out of a manual step.</li>
      </List>
      <Divider className="my-2" />
      <Text size="micro" tone="muted">
        The internal audit these rules come from lives under <InlineCode>docs/audit/</InlineCode>.
        It is not part of this documentation and is not a public artifact.
      </Text>
    </Doc>
  );
}

/* -------------------------------------------------------------------------- */
/* Data                                                                        */
/* -------------------------------------------------------------------------- */

const TABLE_EXAMPLE = `import {
  Table, TableBody, TableCaption, TableCell, TableEmptyRow,
  TableHead, TableHeader, TableRow, TableSortButton,
  EmptyStateFiltered, useTableSort,
} from "@tea-ui/core";
import { EmptyStateFiltered, RowActions } from "@tea-ui/admin";

// A column is only sortable once it has a reader function here. A column with
// no entry therefore has no button either — so no button can exist that does
// nothing when clicked.
const sort = useTableSort<Server, "name" | "disk">({
  columns: {
    name: (row) => row.name,
    disk: (row) => row.disk,
  },
});

<Table label="Server" stickyHeader>
  <TableCaption>Server, ihr Zustand und ihr Speicherplatz</TableCaption>
  <TableHeader>
    <TableRow>
      {/* sort={...} is what gets announced. Without it the column is just
          another column to a screen reader. */}
      <TableHead sort={sort.ariaSortFor("name")}>
        <TableSortButton
          active={sort.activeFor("name")}
          direction={sort.directionFor("name")}
          onClick={() => sort.toggle("name")}
        >
          Name
        </TableSortButton>
      </TableHead>
      <TableHead className="text-end" sort={sort.ariaSortFor("disk")}>
        <TableSortButton
          active={sort.activeFor("disk")}
          direction={sort.directionFor("disk")}
          onClick={() => sort.toggle("disk")}
        >
          Disk
        </TableSortButton>
      </TableHead>
      <TableHead className="w-24 text-end">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {/* sorted() is the whole difference between "sorted" and "looks sorted". */}
    {sort.sorted(servers).map((server) => (
      <TableRow key={server.id}>
        <TableCell>{server.name}</TableCell>
        <TableCell numeric>{server.disk} %</TableCell>
        <TableCell>
          {/* overflowLabel is required: 40 rows with 40 buttons all named
              "More" are 40 identical entries to a screen reader. */}
          <RowActions
            overflowLabel={\`Actions for \${server.name}\`}
            items={[{ label: "Restart", onSelect: restart }]}
          />
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`;

const METER_EXAMPLE = `<Meter
  value={78}
  label="Disk usage on srv-01"
  valueText="18.4 GB of 25 GB used"
  thresholds={[
    { at: 0, tone: "critical" },
    { at: 75, tone: "caution" },
    { at: 101, tone: "positive" },
  ]}
  showThresholds
/>`;

const NAV_EXAMPLE = `const NAV_ITEMS: NavItemData[] = [
  { id: "server", label: "Servers", href: "/server", group: "Infrastructure" },
  { id: "backup", label: "Backups", href: "/backup", group: "Infrastructure" },
];

/* label is required: a <nav> without an aria-label is an unnamed landmark,
    and a screen reader can only skip past it by guessing. */
<Nav label="Main navigation" items={NAV_ITEMS} activeId={activeId} />`;

const GUARD_EXAMPLE = `const [dirty, setDirty] = useState(false);

const { confirmation, guard, markSaved } = useUnsavedChanges({
  dirty,
  save: () => api.save().then(() => setDirty(false)),
});

const onNavigate = async (id: string) => {
  if (!(await guard())) return;   // the user discarded or saved
  router.go(id);
};

return <>{confirmation}<Button onClick={() => onNavigate("server-1")} /></>;`;

const DOC_SERVERS = [
  { name: "srv-02", status: "degraded", disk: 91 },
  { name: "mc-01", status: "offline", disk: 78 },
  { name: "srv-01", status: "online", disk: 62 },
] as const;

/** Severity rank, so the status column sorts by meaning rather than by alphabet. */
const DOC_SEVERITY: Record<(typeof DOC_SERVERS)[number]["status"], number> = {
  online: 0,
  degraded: 1,
  offline: 2,
};

/**
 * The live preview. It is real, not a screenshot: clicking a head reorders the
 * rows, and the head carries `aria-sort`. A docs page that shows a sort button
 * which does nothing is worse than no example at all — it teaches the exact
 * defect the audit found in both source products.
 */
function SortableTableExample(): React.ReactElement {
  const sort = useTableSort<(typeof DOC_SERVERS)[number], "name" | "status" | "disk">({
    initial: { column: "name", direction: "asc" },
    columns: {
      name: (row) => row.name,
      status: (row) => DOC_SEVERITY[row.status],
      disk: (row) => row.disk,
    },
  });

  return (
    <Table label="Server" stickyHeader>
      <TableCaption>Server, ihr Zustand und ihr Speicherplatz</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead sort={sort.ariaSortFor("name")}>
            <TableSortButton
              active={sort.activeFor("name")}
              direction={sort.directionFor("name")}
              onClick={() => sort.toggle("name")}
            >
              Name
            </TableSortButton>
          </TableHead>
          <TableHead sort={sort.ariaSortFor("status")}>
            <TableSortButton
              active={sort.activeFor("status")}
              direction={sort.directionFor("status")}
              onClick={() => sort.toggle("status")}
            >
              Zustand
            </TableSortButton>
          </TableHead>
          <TableHead className="text-end" sort={sort.ariaSortFor("disk")}>
            <TableSortButton
              active={sort.activeFor("disk")}
              direction={sort.directionFor("disk")}
              onClick={() => sort.toggle("disk")}
            >
              Speicher
            </TableSortButton>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sort.sorted(DOC_SERVERS).map((server) => (
          <TableRow key={server.name}>
            <TableCell>{server.name}</TableCell>
            <TableCell>
              <StatusBadge domain="health" status={server.status} />
            </TableCell>
            <TableCell numeric>{server.disk} %</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DataPage(): React.ReactElement {
  return (
    <Doc>
      <Heading level={1}>Data</Heading>
      <Lead>
        The layer that makes an administrative tool what it is: tables, measurements, row actions,
        navigation, and the guard against lost input.
      </Lead>

      <H2>Table</H2>
      <Lead>
        A real <InlineCode>&lt;table&gt;</InlineCode>, not a grid of divs. Head and cell draw from
        the same density steps and therefore cannot drift apart; the header cell carries{" "}
        <InlineCode>scope="col"</InlineCode>, and the overflow area is a named, keyboard-operable
        region.
      </Lead>
      <Example title="Table with sorting, actions and an empty state" code={TABLE_EXAMPLE}>
        <SortableTableExample />
      </Example>
      <ApiTable
        rows={[
          ["label", "string", true, "The name of the overflow region. Required: a scrollable region without a name is a trap a keyboard user cannot get out of."],
          ["stickyHeader", "boolean", false, "The head stays put. It gets an opaque surface automatically — a transparent sticky head shows the rows scrolling underneath it."],
          ["striped", "boolean", false, "Zebra stripes. Off, because the density already carries the rhythm."],
        ]}
      />
      <Divider className="my-2" />
      <Text size="micro" tone="muted">
        <InlineCode>TableEmptyRow</InlineCode> takes the empty text as a child, not as a prop:
        "the filter is the cause" is a decision of the calling application, and a component that
        invented the wording would put one library's string into a product that may want other
        words.
      </Text>

      <H2>useTableSort</H2>
      <Lead>
        <InlineCode>Table</InlineCode> is deliberately presentational: the head is the semantic
        statement, the button is the action, and neither knows what the data looks like. That
        costs something, and the reason the sorting hook exists rather than a prop is the state
        machine every surface would otherwise write: a button that moves a glyph while the rows
        stay put; a hardcoded column that also claims to be sorted next to the one that was
        clicked; and no <InlineCode>aria-sort</InlineCode> anywhere. None of those is a styling
        defect, and none of them is caught by a lint rule. It is the same state machine, written
        again — so it lives here.
      </Lead>
      <ApiTable
        rows={[
          ["columns", "Record<C, (row) => string | number>", true, "How each sortable column reads its value. A column is only sortable once it has an entry here — a column with no entry therefore has no button either, and so no button can exist that does nothing when clicked. Number for numeric columns, string for everything else; the comparator picks the comparison from the return type."],
          ["initial", "TableSortState<C> | null", false, "The sort on first render. `null` (the default) starts unsorted."],
          ["onChange", "(next) => void", false, "On every change, including the return to the unsorted state."],
          ["toggle", "(column) => void", true, "The click handler. The same column cycles ascending → descending → unsorted; a different column starts ascending. The third state is not decoration: `TableHead` omits `aria-sort` entirely when unsorted — a permanent `aria-sort=\"none\"` says \"not sorted\" in every table and is noise. Without a way back to it, omitting it would be a one-way street."],
          ["ariaSortFor", "(column) => \"ascending\" | \"descending\" | undefined", true, "To the `sort` prop of `TableHead`. `undefined` for unsorted columns."],
          ["directionFor", "(column) => \"ascending\" | \"descending\" | \"none\"", true, "To the `direction` prop of `TableSortButton` — it drives the glyph."],
          ["sorted", "(rows) => rows", true, "The rows in sort order, in their original order when unsorted. Always returns a new array, so the result can be kept without aliasing the caller's data."],
        ]}
      />
      <Text size="micro" tone="muted">
        Strings are compared with numeric collation so <InlineCode>srv-2</InlineCode> sorts before{" "}
        <InlineCode>srv-10</InlineCode> — the default collation does the opposite and reads as a
        bug in any product with zero-padded IDs.{" "}
        <InlineCode>Array.prototype.sort</InlineCode> is stable, so equal rows keep their relative
        order.
      </Text>

      <H2>Meter</H2>
      <Lead>
        A measurement within a known range — not the same thing as progress, and therefore a
        different ARIA role: <InlineCode>role="meter"</InlineCode>, because WAI-ARIA defines{" "}
        <InlineCode>progressbar</InlineCode> as task progress. A disk at 87 % is a measurement;
        "87 % done" would be a different, usually wrong statement.
      </Lead>
      <Example title="Meter with thresholds" code={METER_EXAMPLE}>
        <div className="max-w-md">
          <Meter
            value={78}
            label="Disk usage on srv-01"
            valueText="18.4 GB of 25 GB used"
            thresholds={[
              { at: 0, tone: "critical" },
              { at: 75, tone: "caution" },
              { at: 101, tone: "positive" },
            ]}
            showThresholds
          />
        </div>
      </Example>
      <ApiTable
        rows={[
          ["value", "number", true, "The measurement. May exceed max — an overcommitted disk is still a measurement."],
          ["max", "number", false, "The upper bound. Defaults to 100."],
          ["label", "string", true, "The accessible name. Required — without it a meter is an unlabelled bar."],
          ["valueText", "string", false, "The measurement in words. Without it a bare number is announced, and \"18.4 GB of 25 GB used\" is the sentence you actually need."],
          ["thresholds", "MeterThreshold[]", false, "Where the colour changes, read from the top down. `showThresholds` draws the marks on the track."],
        ]}
      />

      <H2>Navigation</H2>
      <Lead>
        A named landmark. The active item carries <InlineCode>aria-current="page"</InlineCode>{" "}
        beside the styling, and the marker is a <strong>border</strong> rather than a fill — ring
        and accent are deliberately the same gold, so a filled active row would erase the focus
        ring painted on it.
      </Lead>
      <Example title="Navigation with groups" code={NAV_EXAMPLE}>
        <div className="max-w-sm border border-line bg-canvas p-2">
          <Nav
            label="Main navigation"
            activeId="server"
            items={[
              { id: "overview", label: "Overview", href: "#/data", group: "General" },
              { id: "server", label: "Servers", href: "#/data", group: "Infrastructure", meta: "12" },
              { id: "backup", label: "Backups", href: "#/data", group: "Infrastructure" },
              { id: "security", label: "Security", href: "#/data", group: "Account" },
            ]}
          />
        </div>
      </Example>

      <H2>Unsaved changes</H2>
      <Lead>
        Losing typed input is the defect that makes people stop trusting an application.
      </Lead>
      <Example title="The guard" code={GUARD_EXAMPLE}>
        <Text size="micro" tone="muted">
          With <InlineCode>save</InlineCode> the dialog leads with <strong>Save</strong> and puts
          discard last. A guard that only offers "leave and lose" teaches everyone to dismiss
          guards.
        </Text>
        <Text size="micro" tone="subtle" className="mt-2">
          <InlineCode>beforeunload</InlineCode> (closing the tab, reloading) cannot be styled —
          that is a browser property, not a gap in the hook.{" "}
          <InlineCode>popstate</InlineCode> (back/forward) is not cancellable either, so the entry
          is pushed back and a live region explains why it did not go through.
        </Text>
      </Example>
    </Doc>
  );
}

/* -------------------------------------------------------------------------- */
/* The registry                                                                */
/* -------------------------------------------------------------------------- */

export const DOC_PAGES: readonly DocPage[] = [
  {
    id: "getting-started",
    title: "Getting started",
    group: "start",
    summary: "Installation, setup, the first component, the first theme.",
    keywords: ["install", "setup", "npm", "import", "theme", "getting started"],
    render: () => <GettingStarted />,
  },
  {
    id: "core",
    title: "Core",
    group: "core",
    summary: "Primitives: layout, typography, inputs, feedback, overlays, navigation.",
    keywords: ["button", "field", "input", "number field", "select", "combobox", "dialog", "toggle", "toggle group", "segmented control", "panel header", "status", "card", "skeleton", "toast", "layout", "typography"],
    render: () => <CorePage />,
  },
  {
    id: "data",
    title: "Data",
    group: "core",
    summary: "Tables, measurements, row actions, navigation, lost input.",
    keywords: [
      "table",
      "thead",
      "caption",
      "scope",
      "sort",
      "meter",
      "progressbar",
      "nav",
      "navigation",
      "aria-current",
      "row actions",
      "overflow",
      "unsaved changes",
      "guard",
    ],
    render: () => <DataPage />,
  },
  {
    id: "admin",
    title: "Admin",
    group: "admin",
    summary: "Shell, metrics and product states for information-dense tools.",
    keywords: ["admin", "shell", "sidebar", "table", "stat", "metric", "empty", "error", "loading", "dashboard", "score", "icon tile", "card grid", "refresh"],
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
    summary: "Interaction, states, errors, forms, navigation, motion.",
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
