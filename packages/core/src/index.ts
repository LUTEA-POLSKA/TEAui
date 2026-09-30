/**
 * TEA UI — Core.
 *
 * The product-agnostic layer. Nothing here knows what a server, a backup or a
 * user is, and nothing here calls an API. If a component needs to know, it
 * belongs in `@tea-ui/admin`, `@tea-ui/public` or `@tea-ui/specialized`.
 *
 * Import from the package root, never from a path. The subtrees are internal and
 * are not covered by semver:
 *
 * ```ts
 * import { Button, Field, Input, FieldLabel } from "@tea-ui/core";
 * import "@tea-ui/core/styles.css"; // once, at the root of your application
 * ```
 */

/* -- layout ---------------------------------------------------------------- */
export {
  AspectRatio,
  Box,
  Center,
  Container,
  CONTAINER_SIZES,
  Divider,
  Flex,
  Grid,
  HStack,
  ScrollArea,
  Spacer,
  Stack,
  VStack,
  type AspectRatioProps,
  type BoxProps,
  type CenterProps,
  type ContainerProps,
  type DividerProps,
  type FlexProps,
  type GridProps,
  type ScrollAreaProps,
  type SpacerProps,
  type StackProps,
} from "./layout";

/* -- typography ------------------------------------------------------------ */
export {
  Blockquote,
  Caption,
  DefinitionDetail,
  DefinitionList,
  DefinitionTerm,
  Eyebrow,
  Heading,
  InlineCode,
  Kbd,
  Link,
  List,
  Preformatted,
  Text,
  textVariants,
  type HeadingProps,
  type LinkProps,
  type ListProps,
  type PreformattedProps,
  type TextProps,
} from "./typography";

/* -- the surface ------------------------------------------------------------- */
export {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Panel,
  type CardProps,
  type CardTitleProps,
  type PanelProps,
} from "./card";

export { PanelHeader, type PanelHeaderProps } from "./panel-header";

/* -- inputs ---------------------------------------------------------------- */
export * from "./inputs";

/* -- feedback -------------------------------------------------------------- */
export * from "./feedback";

/* -- overlays -------------------------------------------------------------- */
export * from "./overlays";

/* -- navigation ------------------------------------------------------------ */
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  MAIN_NAV_LABEL,
  Nav,
  NavItem,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  Pagination,
  SkipLink,
  Sidebar,
  SidebarContent,
  Step,
  StepIndicator,
  StepSeparator,
  Stepper,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toolbar,
  ToolbarButton,
  paginationLinkVariants,
  type AccordionProps,
  type BreadcrumbLinkProps,
  type CollapsibleProps,
  type NavItemData,
  type NavItemProps,
  type NavProps,
  type PaginationProps,
  type SidebarBreakpoint,
  type SidebarContentProps,
  type SidebarProps,
  type SkipLinkProps,
  type StepProps,
  type StepperProps,
  type TabsProps,
} from "./navigation";

/* -- data ------------------------------------------------------------------ */
export * from "./data";

/* -- the shared attribute vocabulary --------------------------------------- */
export { dataSlot, stateAttributes, type StateAttributes } from "./internal";

/* -- formatting ------------------------------------------------------------ */
export {
  TIME_FORMAT_TOKENS,
  formatBytes,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  type ByteSystem,
  type FormatBytesOptions,
  type FormatDateTimeOptions,
  type FormatNumberOptions,
  type FormatRelativeTimeOptions,
} from "./format";
