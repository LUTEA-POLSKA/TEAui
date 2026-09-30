/**
 * TEA UI — Data.
 *
 * Structural data display. Everything here renders a real table element: the
 * row/column relationship a screen reader needs is free on a `<table>` and
 * expensive to rebuild on a grid of `<div>`s. The audit found ten raw tables
 * that each re-decided the head height, the cell padding and the scroll
 * container; this is that decision made once.
 */

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmptyRow,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableSortButton,
  type TableCellProps,
  type TableEmptyRowProps,
  type TableHeadProps,
  type TableProps,
  type TableSortButtonProps,
} from "./table";

export {
  useTableSort,
  type TableSortDirection,
  type TableSortState,
  type UseTableSortOptions,
  type UseTableSortResult,
} from "./use-table-sort";
