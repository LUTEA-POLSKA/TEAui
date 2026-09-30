/**
 * TEA UI Showcase — the element gallery.
 *
 * A scrollable three-column grid of everything the library ships, in the
 * library's own components. The reference for the *layout* was a design-system
 * gallery with a section header per group and a captioned tile per element; the
 * decision to take from it and not to copy is the tile discipline. That gallery
 * gave a Dropdown Menu a 460×300 cell to show a 200×180 menu, so every tile
 * read as an unfilled grid slot rather than a component. Here a tile is sized
 * by its content with a floor, and nothing is scaled down to fit a cell that
 * was sized first.
 *
 * Every entry is a real export. A name that does not exist is a build error,
 * which is the point: the alternative is a gallery that looks complete and is
 * a lie about the API surface.
 */
import * as React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  AspectRatio,
  Badge,
  Blockquote,
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
  CardDescription,
  CardHeader,
  CardTitle,
  Center,
  Checkbox,
  Combobox,
  Container,
  DefinitionDetail,
  DefinitionList,
  DefinitionTerm,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Divider,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Eyebrow,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Flex,
  Grid,
  Heading,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  HStack,
  IconButton,
  InlineCode,
  Input,
  InputGroup,
  InputGroupStart,
  Kbd,
  Link,
  Meter,
  Nav,
  NumberField,
  Pagination,
  Panel,
  PanelHeader,
  PasswordInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Preformatted,
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
  Spacer,
  Spinner,
  Stack,
  StatusBadge,
  StatusDot,
  Switch,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Textarea,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarButton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  VStack,
  type NavItemData,
  toast,
} from "@tea-ui/core";
import {
  CardGrid,
  CardGridItem,
  EmptyState,
  ErrorState,
  IconTile,
  LoadingState,
  MaintenanceState,
  MetricCard,
  NotFoundState,
  OfflineState,
  PermissionDeniedState,
  RefreshButton,
  ServerErrorState,
  RefreshingIndicator,
  RowActions,
  Score,
  StatGrid,
  StatTile,
} from "@tea-ui/admin";
import { Star } from "@tea-ui/icons";

import { Section } from "./chrome";

/* -------------------------------------------------------------------------- */
/* Tiles                                                                       */
/* -------------------------------------------------------------------------- */

interface Tile {
  readonly name: string;
  /** Spans two columns. For elements whose natural width is not a third. */
  readonly wide?: boolean | undefined;
  readonly children: React.ReactNode;
}

interface GalleryGroup {
  readonly id: string;
  readonly label: string;
  readonly tiles: readonly Tile[];
}

/**
 * One tile.
 *
 * The children go in a *wrapping row*, not a column. The first version used
 * `flex-col`, which stacked a seven-button variant list vertically and made the
 * tile 350px tall — the exact defect this gallery was built to avoid, where a
 * tile is sized by a cell rather than by what it holds.
 *
 * The tile is `h-full` with the box at `flex-1` and the caption last, so that
 * captions sit on one baseline across a row. A caption that floats at whatever
 * height its own content happened to reach reads as a rendering bug, because it
 * is one.
 */
function Tile({ name, wide, children }: Tile): React.ReactElement {
  return (
    <div className={wide ? "flex h-full flex-col sm:col-span-2" : "flex h-full flex-col"}>
      <div className="flex min-h-32 flex-1 items-center justify-center border border-line bg-surface p-4">
        <div className="flex max-w-full flex-wrap items-center justify-center gap-2">{children}</div>
      </div>
      <Text size="micro" tone="subtle" className="mt-2 block">
        {name}
      </Text>
    </div>
  );
}

function Group({ id, label, tiles }: GalleryGroup): React.ReactElement {
  return (
    <div className="border-b border-line py-8 last:border-b-0">
      <Eyebrow className="mb-4 block">{label}</Eyebrow>
      <Grid cols={3} gap="section" id={`gallery-${id}`}>
        {tiles.map((tile) => (
          <Tile key={tile.name} name={tile.name} wide={tile.wide}>
            {tile.children}
          </Tile>
        ))}
      </Grid>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Groups                                                                      */
/* -------------------------------------------------------------------------- */

const NAV_ITEMS: readonly NavItemData[] = [
  { id: "overview", label: "Overview", href: "#/gallery", group: "General" },
  { id: "servers", label: "Servers", href: "#/gallery", group: "General", meta: "12" },
  { id: "backups", label: "Backups", href: "#/gallery", group: "Operations" },
];

const ROWS = [
  { name: "srv-01", status: "online" as const, disk: 62 },
  { name: "srv-02", status: "degraded" as const, disk: 91 },
  { name: "mc-01", status: "offline" as const, disk: 78 },
];

const GROUPS: readonly GalleryGroup[] = [
  {
    id: "actions",
    label: "Actions",
    tiles: [
      {
        name: "Button",
        children: (
          <>
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="subtle">Subtle</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </>
        ),
      },
      {
        name: "Button, states",
        children: (
          <>
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </>
        ),
      },
      {
        name: "ButtonGroup",
        children: (
          <ButtonGroup label="Alignment">
            <Button variant="outline">Left</Button>
            <Button variant="outline">Centre</Button>
            <Button variant="outline">Right</Button>
          </ButtonGroup>
        ),
      },
      {
        name: "IconButton",
        children: (
          <>
            <IconButton label="Add" variant="outline">
              <Star size={14} />
            </IconButton>
            <IconButton label="Add" variant="ghost" size="sm">
              <Star size={14} />
            </IconButton>
            <IconButton label="Add" variant="subtle" size="lg">
              <Star size={14} />
            </IconButton>
          </>
        ),
      },
      {
        name: "Link",
        children: (
          <>
            <Link href="#/gallery">Inline link</Link>
            <Text size="micro" tone="muted">
              A link is underlined and carries no variant axis.
            </Text>
          </>
        ),
      },
      {
        name: "Toggle",
        children: (
          /* A Toggle with no children is an empty press target, which makes for a
             tile that shows three blank rectangles. Real use is a formatting bar,
             so that is what it demonstrates. */
          <HStack gap="ui">
            <Toggle aria-label="Bold" defaultPressed>
              <Text size="ui" weight="semibold">
                B
              </Text>
            </Toggle>
            <Toggle aria-label="Italic">
              <Text size="ui" weight="medium">
                I
              </Text>
            </Toggle>
            <Toggle aria-label="Underline" disabled>
              <Text size="ui">
                U
              </Text>
            </Toggle>
          </HStack>
        ),
      },
      {
        name: "ToggleGroup",
        children: (
          /* No frame, no `border-0`, no muted idle items. `selection="outline"`
             means the group draws one outline and the items draw none, so the
             component provides both, plus the text contrast that makes the
             pressed state readable without a fill. The Showcase used to write
             all of that here, which meant the library shipped a selection style
             that only looked correct in the one place that knew the recipe. */
          <ToggleGroup type="single" defaultValue="tea" label="Density" selection="outline" indicator>
            <ToggleGroupItem value="tea">tea</ToggleGroupItem>
            <ToggleGroupItem value="pop">pop</ToggleGroupItem>
            <ToggleGroupItem value="ton">ton</ToggleGroupItem>
          </ToggleGroup>
        ),
      },
      {
        name: "Toolbar",
        children: (
          <Toolbar aria-label="Text formatting">
            <ToolbarButton>B</ToolbarButton>
            <ToolbarButton>I</ToolbarButton>
            <ToolbarButton>U</ToolbarButton>
          </Toolbar>
        ),
      },
    ],
  },
  {
    id: "forms",
    label: "Forms",
    tiles: [
      {
        name: "Field",
        children: (
          <div className="w-64">
            <Field required id="g-field">
              <FieldLabel>Email</FieldLabel>
              <Input type="email" id="g-field-control" aria-describedby="g-field-desc" />
              <FieldDescription>We send no confirmation.</FieldDescription>
            </Field>
          </div>
        ),
      },
      {
        name: "Field, invalid",
        children: (
          <div className="w-64">
            <Field required invalid id="g-field-bad">
              <FieldLabel>Display name</FieldLabel>
              <Input id="g-field-bad-control" aria-invalid="true" aria-describedby="g-field-bad-err" defaultValue="" />
              <FieldError id="g-field-bad-err">The name must not be empty.</FieldError>
            </Field>
          </div>
        ),
      },
      {
        name: "InputGroup",
        children: (
          <div className="w-64">
            <InputGroup>
              <InputGroupStart>
                <Star size={14} aria-hidden="true" />
              </InputGroupStart>
              <Input placeholder="Repository" />
            </InputGroup>
          </div>
        ),
      },
      {
        name: "SearchInput",
        children: (
          <div className="w-64">
            <SearchInput label="Search servers" placeholder="Name or IP" />
          </div>
        ),
      },
      {
        name: "PasswordInput",
        children: (
          <div className="w-64">
            <Field id="g-pw">
              <FieldLabel>Password</FieldLabel>
              <PasswordInput id="g-pw-control" />
            </Field>
          </div>
        ),
      },
      {
        name: "Textarea",
        children: (
          <div className="w-64">
            <Field id="g-notes">
              <FieldLabel>Notes</FieldLabel>
              <Textarea rows={3} id="g-notes-control" placeholder="Optional" />
            </Field>
          </div>
        ),
      },
      {
        name: "NumberField",
        children: (
          <div className="w-64">
            <Field id="g-num">
              <FieldLabel>Storage</FieldLabel>
              <NumberField unit="GB" min={0} max={2048} defaultValue={512} />
            </Field>
          </div>
        ),
      },
      {
        name: "Select",
        children: (
          <div className="w-64">
            <Select defaultValue="prod">
              <SelectTrigger aria-label="Environment">
                <SelectValue placeholder="Choose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dev">Development</SelectItem>
                <SelectItem value="stage">Staging</SelectItem>
                <SelectItem value="prod" description="Live for everyone.">
                  Production
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        ),
      },
      {
        name: "Combobox",
        children: (
          <div className="w-64">
            <Combobox
              label="Select a server"
              placeholder="Type a name"
              options={[
                { value: "srv-01", label: "srv-01", description: "12 GiB RAM" },
                { value: "db-01", label: "db-01", description: "64 GiB RAM" },
              ]}
            />
          </div>
        ),
      },
      {
        name: "Checkbox",
        children: (
          <Stack gap="ui">
            <Checkbox label="Notifications" defaultChecked />
            <Checkbox label="Weekly digest" />
            <Checkbox label="Disabled" disabled />
          </Stack>
        ),
      },
      {
        name: "Switch",
        children: (
          <Stack gap="ui">
            <Switch label="Auto-update" defaultChecked />
            <Switch label="Telemetry" />
            <Switch label="Disabled" disabled />
          </Stack>
        ),
      },
      {
        name: "RadioGroup",
        children: (
          <RadioGroup defaultValue="compact" aria-label="Density">
            <Radio value="compact" label="Compact" />
            <Radio value="default" label="Default" />
            <Radio value="comfortable" label="Comfortable" />
          </RadioGroup>
        ),
      },
      {
        name: "Slider",
        children: (
          <div className="w-64">
            <Slider label="CPU load in percent" defaultValue={[42]} />
          </div>
        ),
      },
    ],
  },
  {
    id: "feedback",
    label: "Feedback",
    tiles: [
      {
        name: "Alert",
        children: (
          <Alert tone="critical">
            <AlertTitle>Connection failed</AlertTitle>
            <AlertDescription>
              The connection to the server dropped three times.
            </AlertDescription>
            <AlertAction>Retry</AlertAction>
          </Alert>
        ),
      },
      {
        name: "Alert, tones",
        children: (
          <Stack gap="ui" className="w-full max-w-56">
            <Alert tone="positive">Saved</Alert>
            <Alert tone="info">Scheduled</Alert>
            <Alert tone="caution">Quota at 90 %</Alert>
            <Alert tone="critical">Failed</Alert>
          </Stack>
        ),
      },
      {
        name: "Badge",
        children: (
          <HStack gap="ui">
            <Badge>neutral</Badge>
            <Badge tone="positive">positive</Badge>
            <Badge tone="info">info</Badge>
            <Badge tone="caution">caution</Badge>
            <Badge tone="critical">critical</Badge>
          </HStack>
        ),
      },
      {
        name: "Callout",
        children: (
          <div className="w-72">
            <Callout tone="caution" title="A tile is a surface">
              So it stays square. <InlineCode>rounded-pill</InlineCode> stays reserved for the five
              pill semantics.
            </Callout>
          </div>
        ),
      },
      {
        name: "StatusBadge",
        children: (
          <HStack gap="ui">
            <StatusBadge domain="health" status="online" />
            <StatusBadge domain="health" status="degraded" />
            <StatusBadge domain="health" status="offline" />
          </HStack>
        ),
      },
      {
        name: "StatusDot",
        children: (
          <HStack gap="ui">
            <StatusDot domain="health" status="online" />
            <StatusDot domain="health" status="degraded" />
            <StatusDot domain="health" status="offline" />
          </HStack>
        ),
      },
      {
        name: "Meter",
        children: (
          <div className="w-56">
            <Meter value={78} label="Disk usage" valueText="18.4 GB of 25 GB used" />
          </div>
        ),
      },
      {
        name: "Progress",
        children: (
          <div className="w-56">
            <Progress value={62} label="Backing up" valueText="62 %" />
          </div>
        ),
      },
      {
        name: "Skeleton",
        children: (
          <div className="w-48">
            <Stack gap="ui">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-28" />
            </Stack>
          </div>
        ),
      },
      {
        name: "Spinner",
        children: <Spinner />,
      },
      {
        name: "Toast",
        children: (
          <Button
            variant="outline"
            onClick={() =>
              toast({
                title: "Settings saved",
                description: "The change is live immediately.",
                tone: "positive",
                action: { label: "Undo", onClick: () => undefined },
              })
            }
          >
            Show a toast
          </Button>
        ),
      },
    ],
  },
  {
    id: "overlays",
    label: "Overlays",
    tiles: [
      {
        name: "Dialog",
        children: (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open</Button>
            </DialogTrigger>
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
        ),
      },
      {
        name: "DropdownMenu",
        children: (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Options</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Archive</DropdownMenuItem>
              <DropdownMenuItem>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
      {
        name: "Popover",
        children: (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Solutions</Button>
            </PopoverTrigger>
            <PopoverContent>
              <Stack gap="ui">
                <Text weight="medium">Insights</Text>
                <Text size="micro" tone="muted">
                  What the numbers did while nobody was looking.
                </Text>
              </Stack>
            </PopoverContent>
          </Popover>
        ),
      },
      {
        name: "Tooltip",
        children: (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>Announced on focus and hover</TooltipContent>
          </Tooltip>
        ),
      },
      {
        name: "HoverCard",
        children: (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Link href="#/gallery">@landnevermore</Link>
            </HoverCardTrigger>
            <HoverCardContent>
              <Stack gap="ui">
                <Text weight="medium">Landnevermore</Text>
                <Text size="micro" tone="muted">
                  Maintainer of this library.
                </Text>
              </Stack>
            </HoverCardContent>
          </HoverCard>
        ),
      },
    ],
  },
  {
    id: "navigation",
    label: "Navigation",
    tiles: [
      {
        name: "Breadcrumb",
        children: (
          <Breadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink href="#/gallery">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#/gallery">Servers</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>srv-01</BreadcrumbPage>
            </BreadcrumbItem>
          </Breadcrumb>
        ),
      },
      {
        name: "Tabs",
        children: (
          <Tabs defaultValue="recent">
            <TabsList>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="popular">Popular</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
            </TabsList>
            <TabsContent value="recent" className="pt-2 text-micro text-fg-muted">
              Sorted by when it happened.
            </TabsContent>
            <TabsContent value="popular" className="pt-2 text-micro text-fg-muted">
              Sorted by how often.
            </TabsContent>
            <TabsContent value="trending" className="pt-2 text-micro text-fg-muted">
              Sorted by the rate of change.
            </TabsContent>
          </Tabs>
        ),
      },
      {
        name: "Accordion",
        children: (
          <div className="w-72">
            <Accordion type="single" collapsible>
              <AccordionItem value="policy">
                <AccordionTrigger>What is your refund policy?</AccordionTrigger>
                <AccordionContent>
                  If you are unhappy with your purchase, we will refund you in full.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="support">
                <AccordionTrigger>Do you offer technical support</AccordionTrigger>
                <AccordionContent>Yes, on the paid tiers.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ),
      },
      {
        name: "Pagination",
        children: (
          <Pagination
            page={2}
            pageCount={9}
            onPageChange={() => undefined}
            aria-label="Pagination"
          />
        ),
      },
      {
        name: "Nav",
        children: (
          <div className="w-56 border border-line bg-canvas p-2">
            <Nav label="Main navigation" items={NAV_ITEMS} activeId="servers" />
          </div>
        ),
      },
    ],
  },
  {
    id: "data",
    label: "Data",
    tiles: [
      {
        name: "Table",
        wide: true,
        children: (
          <div className="w-full">
            <Table label="Servers">
              <TableCaption>Servers, their status and their disk usage</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Server</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">Disk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROWS.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>
                      <StatusBadge domain="health" status={row.status} />
                    </TableCell>
                    <TableCell numeric>{row.disk} %</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ),
      },
      {
        name: "RowActions",
        children: (
          <RowActions
            overflowLabel="Actions for srv-01"
            primary={{ label: "Open srv-01", onSelect: () => undefined }}
            items={[{ label: "Restart", onSelect: () => undefined }]}
          />
        ),
      },
      {
        name: "StatGrid / StatTile",
        children: (
          <StatGrid minTileWidth="8rem">
            <StatTile label="Servers online" value="12" tone="positive" trend="up" trendValue="+2" />
            <StatTile label="CPU load" value="47 %" tone="info" trend="down" trendValue="−6 %" />
          </StatGrid>
        ),
      },
      {
        name: "MetricCard",
        children: (
          <div className="w-56">
            <MetricCard label="Storage" value="412 GiB" tone="caution" hint="of 1 TiB" />
          </div>
        ),
      },
      {
        name: "Score",
        children: (
          <div className="w-40">
            <Score value={82} caption="Lead quality" label="Lead quality" />
          </div>
        ),
      },
      {
        name: "IconTile",
        children: (
          <HStack gap="ui">
            <IconTile size="sm" tone="neutral">
              <Star size={12} />
            </IconTile>
            <IconTile tone="positive">
              <Star size={14} />
            </IconTile>
            <IconTile size="lg" tone="caution">
              <Star size={16} />
            </IconTile>
            <IconTile size="lg" tone="critical">
              <Star size={16} />
            </IconTile>
          </HStack>
        ),
      },
      {
        name: "CardGrid",
        wide: true,
        children: (
          <CardGrid minCardWidth="10rem">
            {[
              { name: "srv-01", spec: "12 GiB RAM" },
              { name: "srv-02", spec: "8 GiB RAM" },
              { name: "db-01", spec: "64 GiB RAM" },
            ].map((entry) => (
              <CardGridItem key={entry.name}>
                <Card>
                  <CardHeader>
                    <CardTitle level={4}>{entry.name}</CardTitle>
                    <CardDescription>{entry.spec}</CardDescription>
                  </CardHeader>
                </Card>
              </CardGridItem>
            ))}
          </CardGrid>
        ),
      },
    ],
  },
  {
    id: "typography",
    label: "Typography",
    tiles: [
      {
        name: "Heading",
        children: (
          <VStack gap="ui">
            <Heading level={1}>Title</Heading>
            <Heading level={3}>Subtitle</Heading>
            <Heading level={5}>Caption</Heading>
          </VStack>
        ),
      },
      {
        name: "Text",
        children: (
          <VStack gap="ui">
            <Text size="title">Title</Text>
            <Text size="lead">Lead</Text>
            <Text size="ui">UI</Text>
            <Text size="micro" tone="muted">
              micro
            </Text>
          </VStack>
        ),
      },
      {
        name: "Eyebrow",
        children: <Eyebrow>Section</Eyebrow>,
      },
      {
        name: "InlineCode",
        children: (
          <HStack gap="ui">
            <InlineCode>applyTheme(&quot;tea&quot;)</InlineCode>
            <Kbd>⌘K</Kbd>
          </HStack>
        ),
      },
      {
        name: "List",
        children: (
          <ul>
            <li className="text-ui">One</li>
            <li className="text-ui">Two</li>
            <li className="text-ui">Three</li>
          </ul>
        ),
      },
      {
        name: "DefinitionList",
        children: (
          <DefinitionList>
            <DefinitionTerm>Theme</DefinitionTerm>
            <DefinitionDetail>A palette and nothing else.</DefinitionDetail>
            <DefinitionTerm>Density</DefinitionTerm>
            <DefinitionDetail>Where every space value comes from.</DefinitionDetail>
          </DefinitionList>
        ),
      },
      {
        name: "Blockquote",
        children: (
          <Blockquote>
            A theme is a palette and nothing else.
          </Blockquote>
        ),
      },
      {
        name: "Preformatted",
        children: <Preformatted>npm install @tea-ui/core</Preformatted>,
      },
    ],
  },
  {
    id: "layout",
    label: "Layout",
    tiles: [
      {
        name: "Stack",
        children: (
          <HStack gap="ui">
            <Stack gap="ui">
              <div className="h-4 w-16 bg-surface-2" />
              <div className="h-4 w-10 bg-surface-2" />
            </Stack>
            <VStack gap="ui">
              <div className="h-4 w-16 bg-surface-2" />
              <div className="h-4 w-10 bg-surface-2" />
            </VStack>
          </HStack>
        ),
      },
      {
        name: "Flex",
        children: (
          <Flex gap="ui" className="w-40">
            <div className="h-6 flex-1 bg-surface-2" />
            <div className="h-6 flex-1 bg-surface-2" />
          </Flex>
        ),
      },
      {
        name: "Grid",
        children: (
          <Grid cols={3} gap="ui" className="w-40">
            {["a", "b", "c", "d", "e", "f"].map((key) => (
              <div key={key} className="h-6 bg-surface-2" />
            ))}
          </Grid>
        ),
      },
      {
        name: "Divider",
        children: (
          <div className="w-40">
            <Divider />
          </div>
        ),
      },
      {
        name: "Spacer",
        children: (
          <div className="flex w-40 items-center gap-2">
            <div className="h-4 w-8 bg-surface-2" />
            <Spacer />
            <div className="h-4 w-8 bg-surface-2" />
          </div>
        ),
      },
      {
        name: "Center",
        children: (
          <div className="w-40">
            <Center className="h-16 border border-line bg-surface-2 text-micro">centred</Center>
          </div>
        ),
      },
      {
        name: "AspectRatio",
        children: (
          <div className="w-28">
            <AspectRatio ratio={16 / 9} className="border border-line bg-surface-2">
              <Text size="micro" tone="subtle">
                16 / 9
              </Text>
            </AspectRatio>
          </div>
        ),
      },
      {
        name: "Panel",
        children: (
          <div className="w-64 border border-line">
            <Panel title="Resources" level={2} description="Current readings" />
          </div>
        ),
      },
      {
        name: "PanelHeader",
        children: (
          <div className="w-64 border border-line">
            <PanelHeader level={2} title="Servers" description="Four instances" />
          </div>
        ),
      },
      {
        name: "Container",
        children: (
          <div className="w-64 border border-line">
            <Container size="sm">
              <Text size="micro">Container</Text>
            </Container>
          </div>
        ),
      },
      {
        name: "Card",
        children: (
          <Card className="w-56">
            <CardHeader>
              <CardTitle level={3}>Deployment</CardTitle>
              <CardDescription>srv-01 · 12 GiB</CardDescription>
            </CardHeader>
            <CardBody>
              <Text size="micro" tone="muted">
                Rolling out now.
              </Text>
            </CardBody>
          </Card>
        ),
      },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    tiles: [
      {
        name: "EmptyState",
        children: (
          <div className="w-64">
            <EmptyState title="No alarms" description="Every service is inside its thresholds." />
          </div>
        ),
      },
      {
        name: "LoadingState",
        children: (
          /* `elapsedMs` is not optional in practice. Below `MIN_SKELETON_MS` the
             component renders `null` on purpose — a fetch that answers in 120ms
             must not flash a skeleton — so a demo that omits it shows an empty
             tile and looks like a broken component rather than a deliberate
             rule. */
          <div className="w-64">
            <LoadingState label="Loading readings" rows={2} elapsedMs={400} />
          </div>
        ),
      },
      {
        name: "ErrorState",
        children: (
          <div className="w-72">
            <ErrorState
              error={{
                title: "Connection failed",
                detail: "The service did not answer after three attempts.",
                action: "The service is probably still running.",
                recovery: "action",
                technical: "ECONNREFUSED 127.0.0.1:19090",
              }}
              onRetry={() => undefined}
            />
          </div>
        ),
      },
      {
        name: "RefreshingIndicator",
        children: <RefreshingIndicator label="Refreshing" />,
      },
      /*
       * These five were missing the first time round, and their absence was not
       * a cosmetic gap. The UX rule is that every asynchronous surface sits in
       * exactly one of seventeen named states. A gallery showing only empty,
       * loading and error therefore advertises a set of three, and a reader
       * concludes the other situations are handled ad hoc — which is the
       * hand-rolled-copy failure the registry exists to prevent. A gallery that
       * understates its own rule is worse than no gallery.
       */
      {
        name: "OfflineState",
        children: (
          <div className="w-64">
            <OfflineState />
          </div>
        ),
      },
      {
        name: "MaintenanceState",
        children: (
          <div className="w-64">
            <MaintenanceState />
          </div>
        ),
      },
      {
        name: "NotFoundState",
        children: (
          <div className="w-64">
            <NotFoundState />
          </div>
        ),
      },
      {
        name: "PermissionDeniedState",
        children: (
          <div className="w-64">
            <PermissionDeniedState />
          </div>
        ),
      },
      {
        name: "ServerErrorState",
        children: (
          <div className="w-64">
            <ServerErrorState />
          </div>
        ),
      },
      {
        name: "RefreshButton",
        children: <RefreshButton refreshing={false} onClick={() => undefined} />,
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export function GallerySection(): React.ReactElement {
  return (
    <Section
      eyebrow="Gallery"
      title="Every element, one grid"
      lead={
        "Three columns, grouped by what an element is for. Every tile renders a real export of " +
        "@tea-ui/core or @tea-ui/admin — a name that does not exist is a build error. The " +
        "section headers are Eyebrow and the grid is Grid; the tile box itself is showcase chrome, " +
        "which is plain markup, like the rest of this page's furniture."
      }
    >
      <div className="flex flex-col">
        {GROUPS.map((group) => (
          <Group key={group.id} {...group} />
        ))}
      </div>
    </Section>
  );
}
