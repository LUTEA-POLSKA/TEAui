import * as React from "react";
import { Toggle as TogglePrimitive, ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { cva, cn, type VariantProps } from "@tea-ui/utils";

import { composeRefs, dataSlot, stateAttributes } from "../internal";
import { useButtonGroupContext } from "./button-group";
import { ToggleIndicator } from "./toggle-indicator";

/**
 * TEA UI — Toggle and ToggleGroup.
 *
 * A button that stays pressed. Two properties separate it from every other
 * control here, and both follow from the fact that it *persists*:
 *
 *  - **`aria-pressed` is a state, not a decoration.** A toggle whose only signal
 *    is a highlight is a plain button to a screen reader user: there is no way
 *    to find out whether the thing they are about to change is already changed.
 *    Radix sets it; the pressed *fill* is the second signal, so the state
 *    survives a monochrome screenshot and a colour-vision deficiency.
 *  - **It belongs in a group.** A lone toggle is usually a checkbox that got the
 *    wrong component, and the styling here assumes peers.
 *
 * `ToggleGroup` is single-select (`type="single"`, `role="radiogroup"`, arrows
 * move and select) or multi-select (`type="multiple"`, `role="group"`, arrows
 * move, Space toggles). Both are Radix, because roving focus across a group is
 * three separate rules and a hand-rolled version gets one of them wrong.
 *
 * **Its children must be `ToggleGroupItem`, not `Toggle`.** This was the one
 * thing that did not work, and it failed silently. `Toggle` is built on Radix's
 * standalone `Toggle`, which knows nothing about a group: it renders
 * `aria-pressed` and never registers a value. So a `ToggleGroup` whose children
 * were `Toggle`s announced `role="radiogroup"` and then contained three plain
 * pressed-buttons — and, worse, the group's own `value`, `defaultValue` and
 * `onValueChange` went nowhere, because nothing inside ever reported a value.
 * The Showcase's theme switcher rendered, highlighted on click, and changed no
 * theme at all: a control that looked switched and was not, which is the same
 * failure as a table that reorders its glyph without reordering its rows.
 */

export const toggleVariants = cva(
  [
    "relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap",
    "rounded-none border border-transparent font-medium",
    "transition-[background-color,border-color,color,box-shadow] duration-fast ease-standard",
    "outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:translate-y-px",
  ],
  {
    variants: {
      variant: {
        default: "border-line bg-surface-3 text-fg hover:bg-line",
        outline: "border-line bg-transparent text-fg hover:border-line-strong hover:bg-surface-2",
      },
      size: {
        sm: "h-[calc(var(--tea-control-h)-0.25rem)] px-[calc(var(--tea-control-px)-0.25rem)] text-micro",
        md: "control-h px-[length:var(--tea-control-px)] text-ui",
        lg: "h-[calc(var(--tea-control-h)+0.25rem)] px-[calc(var(--tea-control-px)+0.25rem)] text-ui",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "md",
    },
  },
);

/**
 * Group-wide styling, read by each `Toggle` in the group.
 *
 * A context rather than cloning the group's children: cloning means a `Toggle`
 * wrapped in a consumer's own component silently loses the group's size, which
 * is the kind of bug nobody reports and everybody sees.
 */
interface ToggleGroupStyleContextValue {
  variant: ToggleProps["variant"];
  size: ToggleProps["size"];
  selection: ToggleSelection;
  /** Whether an indicator carries the selection fill. */
  indicator: boolean;
}

const ToggleGroupStyleContext = React.createContext<ToggleGroupStyleContextValue | null>(null);

/**
 * Which emphasis the pressed state uses.
 *
 * Each value is a Button variant's own recipe, applied to the pressed state.
 * There is no new colour anywhere in this type, and that is a rule rather than
 * an omission: the palette is five tones, closed, and a sixth colour is not a
 * decision this system makes.
 *
 * `outline` is the right choice for a selected segment inside a group that
 * already draws a border. It keeps the surface transparent and marks the state
 * with a stronger line, so the group reads as one outlined field with one
 * emphasised segment. Filling the segment instead — `secondary`'s `surface-3` —
 * makes a second, smaller box inside the first.
 *
 * The rejected alternative is worth recording, because it looks reasonable. In
 * the default theme `brand`, `primary`, `accent` and `ring` are all the same
 * gold, so an `accent`-coloured selection would have been a word with no
 * visible effect — the same defect as the three themes that shipped one palette
 * under three names. It only appears to work in `pop` and `ton`, where the roles
 * differ. A control whose appearance depends on the theme is a control whose
 * appearance you cannot reason about.
 */
export type ToggleSelection = "primary" | "secondary" | "outline";

/**
 * The pressed-state classes, as a lookup rather than as an interpolated string.
 *
 * This is the whole reason the choice is a typed prop instead of a `className`.
 * A template like `` `data-[state=on]:bg-${selection}-subtle` `` produces a
 * class Tailwind cannot see when it scans the source, so the selected state
 * would simply have no colour — with nothing reporting it. This session already
 * produced two instances of that failure, both of which read as a styling
 * decision and neither of which existed in the stylesheet.
 *
 * `secondary` and `outline` mirror `buttonVariants` of the same name, with the
 * hover state promoted to the pressed state. Both use `text-fg` rather than a
 * muted foreground: a selected item is not secondary in meaning, it is only
 * unselected in colour.
 *
 * `outline`'s `border-line-strong` is a *colour*, not a width. A consumer whose
 * group draws one outline and gives its items `border-0` — the right choice for
 * a segmented control, since a per-item border is a second box inside the first
 * — has nothing to colour, so for that consumer the state rests on
 * `bg-surface-2` plus the full-strength text. That is why the Showcase also
 * mutes its idle items: with no border to show, a fill alone is too quiet to
 * read as selected.
 */
const SELECTION_STYLES: Record<ToggleSelection, string> = {
  primary: "data-[state=on]:border-primary data-[state=on]:bg-primary-subtle data-[state=on]:text-primary",
  secondary: "data-[state=on]:border-line-strong data-[state=on]:bg-surface-3 data-[state=on]:text-fg",
  outline: "data-[state=on]:border-line-strong data-[state=on]:bg-surface-2 data-[state=on]:text-fg",
};

/**
 * The same states with the fill removed, for a group that draws a sliding
 * indicator.
 *
 * A separate table rather than a conditional class: the strings have to be
 * complete literals for Tailwind to extract them, and appending a class at
 * runtime is how a tone-interpolated background and a `calc()` inside an
 * arbitrary padding both ended up as code that compiled and did nothing.
 *
 * Which also means the examples are described rather than written out. A comment
 * containing a bracketed utility is a utility as far as Tailwind is concerned —
 * it scans comment text exactly like code — so writing one here injects a
 * misspelled copy of it into every build. An earlier version of this file did
 * that, and esbuild reported the resulting invalid `calc` as a build warning.
 */
const SELECTION_STYLES_NO_FILL: Record<ToggleSelection, string> = {
  primary: "data-[state=on]:border-primary data-[state=on]:text-primary",
  secondary: "data-[state=on]:border-line-strong data-[state=on]:text-fg",
  outline: "data-[state=on]:text-fg",
};

export interface ToggleProps
  extends Omit<React.ComponentProps<typeof TogglePrimitive.Root>, "className">,
    VariantProps<typeof toggleVariants> {
  /** The pressed state, when controlled. */
  pressed?: boolean | undefined;
  /** Initial pressed state, when uncontrolled. */
  defaultPressed?: boolean | undefined;
  /** Called when the pressed state changes. */
  onPressedChange?: ((pressed: boolean) => void) | undefined;
  /** Which emphasis the pressed state uses. Defaults to `primary`. */
  selection?: ToggleSelection | undefined;
  className?: string | undefined;
}

/**
 * @example
 * ```tsx
 * <Toggle pressed={showGrid} onPressedChange={setShowGrid} aria-label="Gitternetz anzeigen">
 *   <Grid3x3 />
 * </Toggle>
 * ```
 */
export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { className, variant, size, selection, pressed, defaultPressed, onPressedChange, ...props },
  ref,
) {
  const buttonGroup = useButtonGroupContext();
  const group = React.useContext(ToggleGroupStyleContext);
  const role = selection ?? group?.selection ?? "primary";

  return (
    <TogglePrimitive.Root
      ref={ref}
      pressed={pressed}
      defaultPressed={defaultPressed}
      onPressedChange={onPressedChange}
      data-tea-touch
      data-tea-grouped={buttonGroup ? buttonGroup.orientation : undefined}
      className={cn(
        toggleVariants({ variant: variant ?? group?.variant, size: size ?? group?.size }),
        SELECTION_STYLES[role],
        className,
      )}
      {...dataSlot("toggle")}
      {...props}
    />
  );
});

export interface ToggleGroupProps
  extends Omit<
      React.ComponentProps<typeof ToggleGroupPrimitive.Root>,
      "type" | "orientation" | "dir" | "children"
    >,
    VariantProps<typeof toggleVariants> {
  /** `single` presses one at a time; `multiple` presses any number. */
  type: "single" | "multiple";
  children?: React.ReactNode;
  /**
   * The accessible name of the group, by the same prop name every other
   * composite in this library uses.
   *
   * It was missing, and the absence is only visible when you write the
   * documentation: `IconButton.label`, `Combobox.label` and `FieldLabel` all
   * take `label`, so a group of radio items silently needed `aria-label`
   * instead — a difference nobody discovers until the docs are written, and
   * one that produces a `radiogroup` with no name if it is missed.
   */
  label?: string | undefined;
  /** Which way the items run. Decides the arrow keys. */
  orientation?: "horizontal" | "vertical";
  /**
   * Which emphasis the selected item uses, for every item in the group.
   *
   * Set once here rather than on each item, for the same reason `variant` and
   * `size` are: an item wrapped in a consumer's own component still gets it.
   */
  selection?: ToggleSelection | undefined;
  /**
   * Draw a sliding indicator behind the selected item instead of letting each
   * item paint its own selection.
   *
   * Opt-in, so no existing consumer changes appearance. It has to be opt-in:
   * the group becomes a positioning context and the indicator carries the
   * selection fill, which is a visible change a consumer must ask for rather
   * than inherit.
   */
  indicator?: boolean | undefined;
  /** Overrides the indicator's own classes, for a different surface or shape. */
  indicatorClassName?: string | undefined;
  className?: string | undefined;
}

/**
 * @example
 * ```tsx
 * <ToggleGroup type="single" value={grid} onValueChange={setGrid} aria-label="Ansicht">
 *   <ToggleGroupItem value="grid">Raster</ToggleGroupItem>
 *   <ToggleGroupItem value="list">Liste</ToggleGroupItem>
 * </ToggleGroup>
 * ```
 */
const ToggleGroupRootPrimitive = ToggleGroupPrimitive.Root as unknown as React.ComponentType<
  React.ComponentProps<"div"> & Record<string, unknown>
>;

/**
 * How a key moves the selection in a `radiogroup`, as an offset in the item list.
 *
 * `null` means the key is not ours to interpret. That includes the cross-axis
 * arrows: a horizontal group must not respond to Up/Down, because doing so would
 * fight the `orientation` prop that exists precisely to describe the axis.
 *
 * Home and End are included because Radix already moves focus for them, and
 * leaving them out would reproduce the same split we are fixing — focus on
 * "ton", value still "tea".
 */
function movementFor(
  key: string,
  orientation: "horizontal" | "vertical",
): 1 | -1 | "first" | "last" | null {
  if (key === "Home") return "first";
  if (key === "End") return "last";
  if (orientation === "horizontal") {
    if (key === "ArrowRight") return 1;
    if (key === "ArrowLeft") return -1;
    return null;
  }
  if (key === "ArrowDown") return 1;
  if (key === "ArrowUp") return -1;
  return null;
}

/**
 * Where a group's items register so the indicator can find the selected one.
 *
 * A registry rather than a query for `[data-state="on"]`, because the item is
 * sometimes inside a consumer's own component and the query would be a second,
 * silent way to break. A `Map` also survives a re-ordered or conditional child
 * list, where an index-based scheme would point the indicator at the wrong item.
 */
interface ToggleGroupIndicatorContextValue {
  enabled: boolean;
  register: (value: string, node: HTMLElement | null) => void;
}

const ToggleGroupIndicatorContext = React.createContext<ToggleGroupIndicatorContextValue | null>(null);

export const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(function ToggleGroup(
  {
    children,
    className,
    label,
    type,
    orientation = "horizontal",
    variant,
    size,
    selection,
    indicator = false,
    indicatorClassName,
    value,
    defaultValue,
    onValueChange,
    // Destructured so it cannot be re-spread over the composed handler below.
    // `{...props}` comes later in the JSX, so a consumer's raw `onKeyDown` used
    // to win and my handler never ran at all — the select-on-arrow behaviour was
    // present in every run that did not happen to pass a key handler, and absent
    // in exactly the runs that did.
    onKeyDown: consumerKeyDown,
    ...props
  },
  ref,
) {
  const groupRef = React.useRef<HTMLDivElement | null>(null);
  // Memoised, and that is load-bearing. An inline `composeRefs(ref, groupRef)`
  // produces a new callback on every render, and React then detaches and
  // reattaches the ref each time — which left `groupRef.current` null when the
  // indicator measured. The indicator silently stayed `pending` instead, because
  // an unmounted-looking indicator is indistinguishable from one with nothing to
  // measure. Stable identity also stops the detach/reattach churn entirely.
  const setGroupRef = React.useMemo(() => composeRefs(ref, groupRef), [ref]);
  const itemNodes = React.useRef(new Map<string, HTMLElement>());

  // A child that mounts or unmounts still has to make the group re-render, so the
  // indicator measures again against the new set of items. That is the whole
  // reason `register` touches React state at all.
  //
  // It used to keep a *version* counter that the indicator used as an effect
  // dependency. That no longer works: the indicator measures on every render,
  // because on an uncontrolled group neither the value nor a version was a
  // dependable signal — the value was permanently `undefined` and the counter
  // only moved on mount and unmount. The indicator was frozen on the first item
  // while the pressed state followed the click.
  //
  // Items register whether or not an indicator is present, because the keyboard
  // handler resolves arrow destinations from the same registry.
  const [, rerenderForRegistry] = React.useReducer((n: number) => n + 1, 0);
  const register = React.useCallback(
    (value: string, node: HTMLElement | null) => {
      if (node) {
        itemNodes.current.set(value, node);
      } else {
        itemNodes.current.delete(value);
      }
      rerenderForRegistry();
    },
    // Empty on purpose: the body touches only `itemNodes` (a ref, stable by
    // definition) and `rerenderForRegistry` (a `useReducer` dispatch, also
    // stable). It read `indicator` here for no reason, which meant every toggle
    // of that prop handed every item a new callback identity and re-registered
    // the whole set for nothing.
    [],
  );

  // A ref object rather than the node itself, so the prop identity is stable and
  // the indicator's effects do not re-run on every parent render.
  //
  // The group tracks the selection itself rather than being told it. Reading
  // `props.value` is what made the indicator permanently invisible on an
  // uncontrolled group: `props.value` is `undefined` there, so the lookup
  // returned `null` and the indicator rendered `display: none` — not on first
  // paint, but forever. It compiled, it type-checked, it accepted the prop, and
  // it drew nothing on the most ordinary usage there is.
  //
  // It has to be state and not a DOM read for a second reason. On an
  // uncontrolled group this function does not re-render when the selection
  // moves — that state lives inside Radix' primitive, below it — and the
  // indicator is an element created in *this* render, so React sees the same
  // child element and bails out of re-rendering it. Measured: the pressed item
  // followed the click and the indicator stayed frozen on the first one.
  // Owning the value makes this component re-render, which is what carries the
  // indicator with it.
  const [internalValue, setInternalValue] = React.useState<string | undefined>(
    typeof defaultValue === "string" ? defaultValue : undefined,
  );
  const currentValue = typeof value === "string" ? value : internalValue;
  const selectedItemRef = React.useRef<HTMLElement | null>(null);
  selectedItemRef.current =
    typeof currentValue === "string" ? (itemNodes.current.get(currentValue) ?? null) : null;

  const indicatorContext = React.useMemo<ToggleGroupIndicatorContextValue>(
    () => ({ enabled: indicator, register }),
    [indicator, register],
  );

  /**
   * Make the arrow keys select, because the group promises `radiogroup`.
   *
   * Radix's `ToggleGroup` announces `role="radiogroup"` but implements *button*
   * keyboard semantics: Space and Enter fire a click and therefore select, while
   * ArrowRight only moves focus. Measured in a browser against this component:
   *
   *   ArrowRight -> keydown only, no click; focus moved to "pop", selection and
   *                 `aria-checked` stayed on "tea"
   *   Enter      -> keydown + click;      focus and selection both on "ton"
   *
   * That is an ARIA conformance failure, not a preference. A radio group whose
   * arrow keys move the focus onto an unselected option tells a screen-reader
   * user they are on "pop" while the value is still "tea" — and it is the same
   * defect this component already had once, when it wrapped hand-written
   * `role="radio"` buttons: announcing a pattern without implementing it.
   *
   * The destination is computed here rather than read from `document.activeElement`
   * after the fact. The first attempt waited a frame and clicked whatever was
   * focused — and clicked the *old* item, because Radix moves the focus after
   * both. Depending on another component's internal ordering for correctness is
   * how the first version of this bug shipped in the first place.
   *
   * Activating by click is deliberate: it is the one path Radix honours for both
   * controlled and uncontrolled groups, so arrow and Space behave identically.
   * In a single-select group, deselecting reports an empty value, which the
   * consumer is expected to ignore — a theme has no "no theme" state.
   */
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      consumerKeyDown?.(event);
      // Deliberately no `if (event.defaultPrevented) return`, and deliberately no
      // opt-out prop. Radix's roving focus calls `preventDefault()` on every
      // arrow key to stop the page from scrolling, and it composes its handler
      // before the consumer's — so a `defaultPrevented` guard disables exactly
      // the behaviour this handler exists to add, silently and on every key
      // press. That is what the first version did, and it looked correct.
      //
      // With no way to read the consumer's intent, the choice is between a veto
      // nobody can find and a group that always behaves like the role it
      // announces. The second is the one that can be reasoned about. A group that
      // wants button semantics should not say `radiogroup`.
      const direction = movementFor(event.key, orientation);
      if (direction === null) return;

      // Registry order is DOM order, and the registry only holds items that
      // actually rendered.
      const nodes = [...itemNodes.current.values()];
      if (nodes.length === 0) return;

      // The origin is the *value*, not the focus. That is what the ARIA pattern
      // says the arrows move from, and it is the only origin that works:
      // `document.activeElement` is wrong in one direction or the other,
      // depending on whether Radix has already moved the focus. Measured in a
      // browser it moves it after this handler, so reading the focus here gave
      // the current item; under jsdom it moves it first, so the same read gave
      // the destination and the handler stepped a second time — clicking the
      // already-selected item, which Radix answers by deselecting (`""`). The
      // difference was invisible until the two environments disagreed, which is
      // the argument for anchoring to state instead of to another component's
      // timing. `data-state` is read from the DOM, so it is correct whether the
      // group is controlled or not.
      const selected = nodes.find((node) => node.dataset.state === "on");
      const from = selected
        ? nodes.indexOf(selected)
        : nodes.indexOf(document.activeElement as HTMLElement);

      // `first` and `last` are positions, not offsets. Treating them as offsets —
      // `0` for first, `length - 1` for last — makes Home a no-op unless you
      // were already home, and End a no-op unless you were already at the end,
      // which is the same class of bug as a focus-only arrow key: the key does
      // something, and it is the wrong thing.
      const to =
        direction === "first"
          ? 0
          : direction === "last"
            ? nodes.length - 1
            : from < 0
              ? 0
              : (from + direction + nodes.length) % nodes.length;

      const target = nodes[to];
      if (!target) return;
      // A keyboard move that lands on the current value must be a no-op. In a
      // single-select group a click is a *toggle*, so pressing ArrowRight in a
      // one-item group — or Home while already home — would report `""` and
      // clear a theme that has no "no theme" state. Radix's toggle is right for
      // a mouse and wrong for "go to".
      if (target === selected) return;
      target.click();
    },
    [consumerKeyDown, orientation],
  );

  // Radix supplies the role: `radiogroup` for single, `group` for multiple.
  const style = React.useMemo<ToggleGroupStyleContextValue>(
    () => ({
      variant: variant ?? "outline",
      size: size ?? "md",
      selection: selection ?? "primary",
      indicator,
    }),
    [variant, size, selection, indicator],
  );

  return (
    <ToggleGroupStyleContext.Provider value={style}>
      <ToggleGroupIndicatorContext.Provider value={indicatorContext}>
        {/* Radix types `type` as a per-variant literal, so a caller forwarding a
          `ToggleGroupProps["type"]` union is genuinely correct — only the
          narrowing is unrepresentable in the type. Runtime behaviour is Radix's. */}
        <ToggleGroupRootPrimitive
          {...(props as React.ComponentProps<"div">)}
          ref={setGroupRef}
          type={type}
          orientation={orientation}
          /*
           * Forwarded explicitly. `value`, `defaultValue` and `onValueChange`
           * are destructured so this file can mirror the selection and compose
           * the handler — but destructuring removes them from the `{...props}`
           * spread further down, so the primitive has to be given them back.
           * Without this the group started with nothing selected at all, on
           * every uncontrolled render.
           */
          value={value}
          defaultValue={defaultValue}
          // The name goes on the group, and only as a fallback: an explicit
          // `aria-label` from the consumer still wins, because a label is a
          // convenience and `aria-label` is the contract.
          aria-label={label}
          onKeyDown={handleKeyDown}
          /*
           * Radix already reports every selection change, controlled or not. The
           * group mirrors it into its own state so that the indicator has a
           * value to resolve, and the consumer's handler is composed rather than
           * replaced — the same reason `onKeyDown` is composed above.
           */
          onValueChange={
            ((next: string) => {
              if (typeof next === "string") setInternalValue(next);
              (onValueChange as ((v: string) => void) | undefined)?.(next);
            }) as unknown as ToggleGroupProps["onValueChange"]
          }
          data-orientation={orientation}
          data-tea-touch
          className={cn(
            "inline-flex items-stretch rounded-none",
            orientation === "vertical" ? "flex-col" : "flex-row",
            "[&>*+*]:-ms-px",
            // The indicator is positioned in pixels against this box, so the
            // group has to be the positioning context for it.
            indicator && "relative",
            /*
             * `selection="outline"` means exactly this: the group draws one
             * outline and the items draw none. It was the group's job to say so,
             * and it was not doing it — so every consumer had to write
             * `border border-line p-1` here and `border-0` on each item, and the
             * Showcase documented the recipe in a comment instead of the
             * component providing it.
             *
             * The cost of leaving it out is not cosmetic. Without the 4px inset
             * the indicator fills its cell flush, and since the outline items
             * have no border to colour, `data-[state=on]:text-fg` is the *only*
             * thing marking the pressed state — a text-colour change with no
             * background difference, which is close to invisible. Measured on the
             * Showcase, the two controls built from identical props (this one and
             * the header's theme switcher) had the same indicator colour and
             * looked like different components, because one had the frame and one
             * did not.
             *
             * Only `outline` gets it. `primary` and `secondary` paint the item
             * itself, so a group frame would be a second box inside the first —
             * the exact thing `outline` exists to avoid.
             */
            selection === "outline" && "border border-line p-1",
            className,
          )}
          {...stateAttributes({ orientation })}
          {...dataSlot("toggle-group")}
          {...props}
        >
          {indicator ? (
            <ToggleIndicator
              groupRef={groupRef}
              itemRef={selectedItemRef}
              className={indicatorClassName}
            />
          ) : null}
          {children}
        </ToggleGroupRootPrimitive>
      </ToggleGroupIndicatorContext.Provider>
    </ToggleGroupStyleContext.Provider>
  );
});

export interface ToggleGroupItemProps
  extends Omit<React.ComponentProps<typeof ToggleGroupPrimitive.Item>, "className">,
    VariantProps<typeof toggleVariants> {
  /** Overrides the group's `selection` for this item only. */
  selection?: ToggleSelection | undefined;
  className?: string | undefined;
}
/**
 * The selectable member of a `ToggleGroup`.
 *
 * This is the piece that makes the group a control rather than a container. It
 * is a Radix `ToggleGroup.Item`, so it reports its value to the group, carries
 * `role="radio"` and `aria-checked` in a single-select group, and takes part in
 * the roving tabindex — the group is one tab stop and the arrow keys move within
 * it. `Toggle` cannot do any of that, because it is a standalone toggle button
 * that never talks to a group.
 *
 * It reads the same style context as `Toggle`, so `variant` and `size` set once
 * on the group still reach items that are wrapped in a consumer's own component.
 */
const ToggleGroupItemPrimitive = ToggleGroupPrimitive.Item as unknown as React.ComponentType<
  React.ComponentProps<"button"> & Record<string, unknown>
>;
export const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  function ToggleGroupItem({ className, variant, size, selection, value, ...props }, ref) {
    const group = React.useContext(ToggleGroupStyleContext);
    const indicatorCtx = React.useContext(ToggleGroupIndicatorContext);
    const role = selection ?? group?.selection ?? "primary";
    const key = typeof value === "string" ? value : undefined;
    const localRef = React.useRef<HTMLButtonElement | null>(null);
    // Stable for the same reason as the group's: a fresh callback per render
    // would leave `localRef.current` null when the indicator measures the item.
    const setItemRef = React.useMemo(() => composeRefs(ref, localRef), [ref]);

    // Registration is an effect, not a render-phase call: `register` bumps state
    // in the group, and updating another component while rendering is exactly
    // the kind of thing that passes a test and explodes in an app. The cleanup
    // unregisters, which is what keeps the map free of detached nodes when a
    // child unmounts.
    //
    // Unconditional, and deliberately so. The registry has two readers: the
    // indicator, to measure the selected item, and the group, to resolve the
    // arrow-key destination. Gating it on `indicator` made the second one
    // conditional too — a group without an indicator silently lost select-on-arrow,
    // which is an ARIA failure that depends on an unrelated prop. A keyboard
    // behaviour that a presentational prop can switch off is not a guarantee.
    React.useEffect(() => {
      if (!key) {
        return;
      }
      const ctx = indicatorCtx;
      ctx?.register(key, localRef.current);
      return () => ctx?.register(key, null);
    }, [indicatorCtx, key]);

    return (
      <ToggleGroupItemPrimitive
        ref={setItemRef}
        value={value}
        data-tea-touch
        className={cn(
          toggleVariants({ variant: variant ?? group?.variant, size: size ?? group?.size }),
          // With the indicator on, it carries the fill - otherwise the selected
          // item paints a background *and* gets one behind it, which reads as a
          // slightly misaligned double shape.
          indicatorCtx?.enabled ? SELECTION_STYLES_NO_FILL[role] : SELECTION_STYLES[role],
          /*
           * The group draws the outline for `selection="outline"`, so the item
           * must not draw one of its own — a per-item border inside the group's
           * frame is a second box inside the first.
           */
          role === "outline" && "border-0",
          /*
           * With the indicator on, the outline style has no fill and no border to
           * colour, so `text-fg` on the pressed item was the whole selected state
           * — and the idle items are also `text-fg`, which means no contrast at
           * all. The Showcase muted its idle items by hand for exactly this
           * reason. That contrast is part of the selection style, so the style
           * provides it: idle muted, pressed full.
           */
          role === "outline" &&
            indicatorCtx?.enabled &&
            "text-fg-muted data-[state=on]:text-fg",
          // Positioned so it paints above the indicator, which is an earlier,
          // absolutely positioned sibling.
          indicatorCtx?.enabled && "relative",
          className,
        )}
        {...dataSlot("toggle", "group-item")}
        {...props}
      />
    );
  },
);
