import * as React from "react";
import { MoreHorizontal } from "@tea-ui/icons";
import { COPY, type ConsequenceLevel } from "@tea-ui/ux-standards";
import { cn } from "@tea-ui/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  useConfirm,
  type ButtonProps,
  type IconButtonProps,
} from "@tea-ui/core";

/**
 * TEA UI Admin — row actions.
 *
 * The audit's pattern for a table row: two or three controls at the right, with
 * the destructive one wherever it happened to fall in the ordering. The
 * standard that fixes it is a contract, not a style — *destructive is never the
 * most prominent action of a row* — and a contract that lives only in a document
 * is the kind that survives three quarters.
 *
 * So the ordering is decided here, once:
 *  - the row's primary action is first and is the only labelled control;
 *  - secondary actions go into an overflow menu, because a row with five icon
 *    buttons is a row nobody can read;
 *  - **the destructive action is last, after a separator**, so it cannot be
 *    reached by a stray second click two icons in;
 *  - the destructive item takes `level="irreversible"` and therefore a typed
 *    confirmation word — see `docs/audit/CONSOLIDATION.md` §5 for why the
 *    delete confirmation is not a bare "are you sure".
 *
 * `MoreHorizontal` is imported from the curated icon surface, never from
 * `lucide-react`. `IconButton` supplies the accessible name and hides the glyph
 * from the accessibility tree itself, so the overflow button is named
 * "More actions" rather than announced as a bare button.
 */
export interface RowAction {
  /** The action's name. Shown in the menu, and its accessible name in the row. */
  label: string;
  /** Glyph for the row's primary action, or inside the menu item. */
  icon?: React.ReactNode;
  onSelect: () => void;
  /** Visual weight of the row's primary action. */
  variant?: ButtonProps["variant"];
  disabled?: boolean | undefined;
}

/** The variant an overflow trigger is allowed to be — `link` is not a control. */
type OverflowVariant = Extract<IconButtonProps["variant"], "ghost" | "outline" | "subtle">;

export interface RowActionsProps extends Omit<React.ComponentProps<"div">, "color"> {
  /**
   * The one action that stays visible in the row. Everything else is behind the
   * overflow menu. A row with two visible actions needs two `RowActions` cells,
   * not a wider one.
   */
  primary?: RowAction | undefined;
  /** Menu items, rendered in order. */
  items?: readonly RowAction[] | undefined;
  /** Group heading inside the menu. */
  menuLabel?: string | undefined;
  /**
   * The accessible name of the overflow button. It must describe the *region*,
   * not the button — "Actions for srv-01", not "More". A table of forty rows
   * with forty buttons all named "More" gives a screen-reader user forty
   * identical entries and no way to tell them apart.
   */
  overflowLabel: string;
  /** Visual weight of the overflow trigger. */
  overflowVariant?: OverflowVariant;
}

/**
 * The row's action cell.
 *
 * @example
 * ```tsx
 * <TableCell>
 *   <RowActions
 *     overflowLabel={`Actions for ${server.name}`}
 *     primary={{ label: "Open server", icon: <ExternalLink />, onSelect: open }}
 *     items={[{ label: "Restart", onSelect: restart }]}
 *   />
 * </TableCell>
 * ```
 */
export function RowActions({
  primary,
  items,
  menuLabel = COPY.a11y.more,
  overflowLabel,
  overflowVariant = "ghost",
  className,
  ...props
}: RowActionsProps): React.ReactElement {
  const menuItems = items ?? [];
  return (
    <div className={cn("flex items-center justify-end gap-1", className)} {...props}>
      {primary ? (
        <IconButton
          label={primary.label}
          variant={primary.variant ?? "ghost"}
          size="sm"
          disabled={primary.disabled}
          onClick={primary.onSelect}
        >
          {primary.icon}
        </IconButton>
      ) : null}

      {menuItems.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton label={overflowLabel} variant={overflowVariant} size="sm">
              <MoreHorizontal size={14} />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {menuItems.map((item) => (
              <DropdownMenuItem
                key={item.label}
                disabled={item.disabled}
                onSelect={item.onSelect}
                className="gap-2"
              >
                {item.icon ? (
                  <span aria-hidden="true" className="text-fg-subtle">
                    {item.icon}
                  </span>
                ) : null}
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Destructive actions                                                         */
/* -------------------------------------------------------------------------- */

/**
 * A row action whose consequence has to be confirmed.
 *
 * A row that deletes something is the one place where "are you sure?" is not
 * theatre — the user is looking at a list of forty things and has no other
 * context for which one they just clicked. So the consequence is named, and for
 * an irreversible action the user types the name of the thing.
 */
export interface DestructiveRowAction extends RowAction {
  level: ConsequenceLevel;
  /** What is being destroyed, e.g. "The server". */
  what: string;
  /** The word the user must type at `irreversible`. */
  confirmWord?: string | undefined;
}

/**
 * Run a destructive row action through the standard's ladder.
 *
 * | level          | what happens                                       |
 * |----------------|----------------------------------------------------|
 * | `reversible`   | undo is offered, nothing is asked                  |
 * | `recoverable`  | a confirm dialog naming the consequence           |
 * | `irreversible` | the dialog plus a typed confirmation word          |
 *
 * The component deliberately does not decide which level applies — whether an
 * action is reversible is a fact about the caller's backend, and a component
 * that guesses wrong about a deletion is worse than one that asks.
 *
 * @example
 * ```tsx
 * const runRowAction = useRowAction();
 *
 * await runRowAction({
 *   level: "irreversible",
 *   label: "Delete",
 *   what: `The server ${server.name}`,
 *   confirmWord: server.name,
 *   onSelect: () => remove(server.id),
 * });
 * ```
 */
export function useRowAction() {
  const [confirmation, ask] = useConfirm();

  /**
   * @returns `true` when the action ran. A `reversible` action asks nothing and
   * runs immediately — the undo toast *is* the confirmation, and a dialog for
   * something the user can take back is a dialog that teaches people to click
   * through dialogs.
   */
  const run = React.useCallback(
    async (action: DestructiveRowAction): Promise<boolean> => {
      if (action.level === "reversible") {
        action.onSelect();
        return true;
      }

      const ok = await ask({
        level: action.level,
        what: action.what,
        confirmWord: action.confirmWord,
      });

      if (!ok) return false;
      action.onSelect();
      return true;
    },
    [ask],
  );

  return { confirmation, run } as const;
}
