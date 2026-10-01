/**
 * TEA UI Admin.
 *
 * The information-dense layer: an application shell, metric tiles, product
 * states and the data surfaces that a management tool is made of. Where Core
 * is neutral, Admin is optimised for scanning, for keyboard-heavy work, and for
 * showing a lot of state at once without the state competing with itself.
 *
 * Everything here composes Core. Nothing here calls an API or knows what a
 * server is — the domain arrives as props, as a wire value, or as a status key
 * resolved through `@tea-ui/ux-standards`.
 */
export { AdminShell, Page, PageHeader, type AdminShellProps, type NavItem, type PageHeaderProps, type PageProps } from "./shell";

export {
  EmptyState,
  EmptyStateFiltered,
  EmptyStateNew,
  ErrorState,
  LoadingState,
  MaintenanceState,
  NotFoundState,
  OfflineState,
  PermissionDeniedState,
  RefreshingIndicator,
  ServerErrorState,
  type EmptyStateProps,
  type ErrorStateProps,
  type LoadingStateProps,
  type StateMessageProps,
} from "./states";

export {
  MetricCard,
  StatGrid,
  StatTile,
  statTileVariants,
  type MetricCardProps,
  type StatGridProps,
  type StatTileProps,
  type Trend,
} from "./data/stat-tile";

export { RefreshButton, type RefreshButtonProps } from "./data/refresh-button";

export {
  DEFAULT_SCORE_BANDS,
  LEAD_SCORE_BANDS,
  SCORE_BANDS,
  Score,
  scoreBand,
  type ScoreBand,
  type ScoreProps,
} from "./data/score";

export {
  CardGrid,
  CardGridItem,
  IconTile,
  iconTileVariants,
  type CardGridProps,
  type IconTileProps,
} from "./data/composites";

export {
  RowActions,
  useRowAction,
  type DestructiveRowAction,
  type RowAction,
  type RowActionsProps,
} from "./data/row-actions";
