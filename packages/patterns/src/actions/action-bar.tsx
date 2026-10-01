import * as React from "react";
import {
  Button,
  ButtonGroup,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  dataSlot,
} from "@tea-ui/core";
import { cn } from "@tea-ui/utils";
import { COPY } from "@tea-ui/ux-standards";

/**
 * TEA UI Patterns — ActionBar.
 *
 * The row of actions that belongs to one context: a table's toolbar, a panel's
 * header, a form's footer.
 *
 * The audit's finding was not "the buttons were the wrong colour". It was that
 * the *order* was whatever each project happened to write first, which meant
 * "Delete" landed to the left of "Save" on a form and next to "Edit" on a row.
 * That order is not a style question — it is a claim about which action a user
 * is most likely to take by reflex, made silently and differently everywhere.
 * The bar therefore **places primary left and destructive right, regardless of
 * the order the actions were passed in.** A consumer that gets the order wrong
 * still gets the right one, because the alternative is trusting every consumer.
 *
 * **More than five actions go into a menu, not onto a second line.** A row that
 * wraps is a row whose right end — where the destructive action now lives — can
 * fall below the fold. The count is capped rather than the width, because the
 * width depends on the viewport and the risk does not.
 *
 * **Every action has a text label, and the type says so.** `label` is a required
 * string, not an optional prop with an icon fallback. An icon-only action has to
 * be guessed at from its glyph; making it impossible to declare one is the only
 * version of this rule that survives a deadline. `icon` decorates a label, it
 * does not replace one.
 *
 * Destructive actions are never part of the overflow menu's inline set, and
 * never counted against `maxVisible` — see the file header on why they cannot be
 * the thing that gets pushed out of reach.
 */

export type ActionBarTone = "default" | "primary" | "destructive";

export interface ActionBarAction {
  /**
   * The visible text. **Required** — see the file header. A label is also the
   * accessible name, so an action cannot be reachable-but-unnamed.
   */
  label: string;
  onSelect?: () => void;
  /** Defaults to `"default"`. Drives both order and colour. */
  tone?: ActionBarTone;
  /** Decoration beside the label. Never a replacement for it. */
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface ActionBarProps extends Omit<React.ComponentProps<"div">, "children"> {
  actions: readonly ActionBarAction[];
  /**
   * Name for the group. Defaults to `COPY.a11y.selected`, because a
   * `role="group"` with no name is a stop in the structure list that says
   * nothing about what the row is for.
   */
  label?: string;
  /**
   * How many non-destructive actions render inline before the rest move into
   * the overflow menu. Defaults to 5.
   */
  maxVisible?: number;
  /** Text for the overflow trigger. Defaults to `COPY.a11y.more`. */
  overflowLabel?: string;
}

const VARIANT: Record<ActionBarTone, "primary" | "outline" | "destructive"> = {
  primary: "primary",
  default: "outline",
  destructive: "destructive",
};

/** Primary before default, so the likely action sits where the eye lands first. */
const TONE_ORDER: Record<Exclude<ActionBarTone, "destructive">, number> = {
  primary: 0,
  default: 1,
};

/**
 * @example
 * ```tsx
 * <ActionBar
 *   label="Row actions"
 *   actions={[
 *     { label: "Edit", onSelect: edit, tone: "primary" },
 *     { label: "Archive", onSelect: archive },
 *     { label: "Delete", onSelect: remove, tone: "destructive" },
 *   ]}
 * />
 * ```
 */
export const ActionBar = React.forwardRef<HTMLDivElement, ActionBarProps>(function ActionBar(
  {
    actions,
    className,
    label = COPY.actions.details,
    maxVisible = 5,
    overflowLabel = COPY.a11y.more,
    ...props
  },
  ref,
) {
  const destructive = React.useMemo(
    () => actions.filter((action) => action.tone === "destructive"),
    [actions],
  );

  /*
   * Destructive is split out *before* the cap is applied, so a full bar can never
   * push "Delete" into a menu. Hiding a destructive action behind an overflow is
   * not a smaller version of the mistake — it is the mistake the left/right rule
   * exists to prevent, moved somewhere the user will not look for it.
   */
  const rest = React.useMemo(
    () =>
      actions
        .filter((action) => action.tone !== "destructive")
        .slice()
        .sort(
          (a, b) =>
            (TONE_ORDER[(a.tone ?? "default") as Exclude<ActionBarTone, "destructive">] ?? 1) -
            (TONE_ORDER[(b.tone ?? "default") as Exclude<ActionBarTone, "destructive">] ?? 1),
        ),
    [actions],
  );

  const visible = rest.slice(0, Math.max(0, maxVisible));
  const overflow = rest.slice(Math.max(0, maxVisible));

  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      data-tea-touch
      {...dataSlot("action-bar")}
      {...props}
    >
      {visible.length > 0 ? (
        <ButtonGroup label={label} className="flex-wrap">
          {visible.map((action) => (
            <Button
              key={action.label}
              variant={VARIANT[action.tone ?? "default"]}
              onClick={action.onSelect}
              disabled={action.disabled}
              {...dataSlot("action-bar-action")}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </ButtonGroup>
      ) : null}

      {overflow.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" {...dataSlot("action-bar-overflow")}>
              {overflowLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent aria-label={overflowLabel}>
            {overflow.map((action) => (
              <DropdownMenuItem
                key={action.label}
                onSelect={action.onSelect}
                disabled={action.disabled}
                {...dataSlot("action-bar-overflow-item")}
              >
                {action.icon}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {/*
        * `ms-auto` pushes the destructive group to the far end of the row. On a
        * narrow window it drops to its own line instead — still after everything
        * else, which is the part the contract is about.
        */}
      {destructive.length > 0 ? (
        <div className="ms-auto flex items-center gap-2" {...dataSlot("action-bar-destructive")}>
          {destructive.map((action) => (
            <Button
              key={action.label}
              variant="destructive"
              onClick={action.onSelect}
              disabled={action.disabled}
              {...dataSlot("action-bar-action")}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
});