import * as React from "react";
import { Check, ChevronDown, Search, X } from "@tea-ui/icons";
import { cn, cva, type VariantProps } from "@tea-ui/utils";

import { dataSlot, stateAttributes } from "../internal";
import { useFieldControlProps } from "./field";

/**
 * TEA UI — Combobox.
 *
 * The ARIA 1.2 combobox/listbox pattern, implemented properly. This component
 * exists because the audit's global search had *no* combobox semantics at all:
 * no `role="combobox"`, no `aria-expanded`, no `aria-activedescendant`, no arrow
 * keys, and results that were plain buttons. A screen-reader user and a
 * keyboard-only user both had no way to know a result list existed, let alone
 * move through it.
 *
 * The pattern, in full:
 *  - the input is the combobox: `role="combobox"`, `aria-expanded`,
 *    `aria-controls` pointing at the list, `aria-activedescendant` pointing at
 *    the active option;
 *  - the list is `role="listbox"`, the options are `role="option"` with
 *    `aria-selected`;
 *  - ArrowDown/ArrowUp move the active option and scroll it into view,
 *    Home/End jump, Enter selects, Escape reverts the query first and closes
 *    second;
 *  - the active option is tracked with `aria-activedescendant`, never by moving
 *    DOM focus, so the query text is not destroyed on every keystroke.
 *
 * Options are supplied, not fetched. The component takes `options` and an
 * optional `filter`; async resolution belongs to the product, which is why
 * `loading` and `emptyMessage` are props rather than a data source.
 */

export interface ComboboxOption {
  /** The value emitted on selection. */
  readonly value: string;
  /** The visible label. */
  readonly label: string;
  /** Optional secondary text. Never the only carrier of meaning. */
  readonly description?: string | undefined;
  /** Group heading. Rendered as a `role="presentation"` separator row. */
  readonly group?: string | undefined;
  /** Disabled options stay visible and stay focusable, but cannot be chosen. */
  readonly disabled?: boolean | undefined;
}

interface ComboboxSharedProps
  extends Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "onSelect" | "size">,
    Omit<VariantProps<typeof comboboxTriggerVariants>, "size"> {
  /** The accessible name. Required — the search icon is not a label. */
  label: string;
  options: readonly ComboboxOption[];
  /** Called on every keystroke, with the raw query. */
  onQueryChange?: ((query: string) => void) | undefined;
  /**
   * Filtering. Defaults to a case- and diacritic-insensitive substring match
   * over the label, so a product that needs fuzzy search opts in rather than
   * getting it by accident.
   */
  filter?: ((option: ComboboxOption, query: string) => boolean) | undefined;
  /**
   * Locale for the default filter. Omit it and matching follows the runtime's
   * locale, which is what a library that ships to unknown users has to do.
   */
  locale?: string | undefined;
  /**
   * Shown when the query matches nothing. Defaults to English; a product with
   * another language passes its own string. See `clearLabel` for why the
   * defaults are English rather than absent.
   */
  emptyMessage?: string | undefined;
  /** Accessible name for the clear button. Defaults to English. */
  clearLabel?: string | undefined;
  /** A search is running. Shows a spinner and sets `aria-busy`. */
  loading?: boolean | undefined;
  /** Disable the whole control. */
  disabled?: boolean | undefined;
  className?: string | undefined;
}

/**
 * One prop type per mode, rather than `value?: string` with a `multiple` flag
 * beside it.
 *
 * The previous shape let a single-select consumer pass an array and said
 * nothing, and let a multi-select consumer believe it was receiving the
 * selection when it was receiving one value of it. The internal state was
 * always an array; the public type was not. A type that disagrees with the
 * component is a defect that only surfaces in someone else's product, so the
 * split lives in the type: with `multiple`, `value` is `string[]` and
 * `onValueChange` reports the whole selection.
 */
export type ComboboxProps =
  | (ComboboxSharedProps & {
      multiple?: false | undefined;
      /** The controlled selection: one option's value. */
      value?: string | undefined;
      defaultValue?: string | undefined;
      onValueChange?: ((value: string) => undefined | void) | undefined;
    })
  | (ComboboxSharedProps & {
      multiple: true;
      /** The controlled selection. */
      value?: readonly string[] | undefined;
      defaultValue?: readonly string[] | undefined;
      /** Called with the complete selection, after every change. */
      onValueChange?: ((value: string[]) => undefined | void) | undefined;
    });

export const comboboxTriggerVariants = cva(
  [
    "control-h inline-flex w-full items-center gap-2 border bg-surface px-[length:var(--tea-control-px)] text-ui text-fg",
    "transition-colors duration-fast ease-standard",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:border-critical",
  ],
  {
    variants: {
      variant: {
        outline: "border-line data-[hover]:border-line-strong",
        ghost: "border-transparent bg-transparent",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);

/**
 * Case- and diacritic-insensitive substring match.
 *
 * This was `toLocaleLowerCase("de")` on both sides, which is a library
 * silently declaring its users' locale. German `ß` does not lowercase to `ss`,
 * so a search for `ss` missed a label ending in `ß` — and every user of every
 * other language got German case rules they never asked for, including the
 * Turkish dotless-i problem, which is a visible bug rather than a subtle one.
 *
 * Folding is NFD plus combining-mark removal, so `cafe` finds `Café`, and
 * lowercasing goes through the runtime's own locale rules. `locale` is
 * available for the consumer who needs to pin it; the library does not guess a
 * language on their behalf.
 *
 * The known limit: no folding treats `ß` and `ss` as equal, because no
 * standard case mapping joins them. Callers who need that pass a `filter`.
 */
const makeFilter =
  (locale?: string) =>
  (option: ComboboxOption, query: string): boolean => {
    const needle = query.trim();
    if (!needle) return true;
    const fold = (text: string): string =>
      text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase(locale);
    return fold(option.label).includes(fold(needle));
  };

/** Stable, id-safe DOM ids for one listbox. */
export const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
  {
    label,
    options,
    value,
    defaultValue,
    onValueChange,
    onQueryChange,
    filter,
    locale,
    emptyMessage = "No matches",
    clearLabel = "Clear search",
    loading = false,
    disabled = false,
    multiple = false,
    variant,
    className,
    ...props
  },
  ref,
) {
  const field = useFieldControlProps();

  // The union type makes this a narrowing rather than a cast at every use: the
  // multi branch's `onValueChange` is known to take an array, the single
  // branch's is known to take a string. The assertions are the honest price of
  // destructuring a discriminated union.
  //
  // Memoised, because `commit` depends on it: a fresh object per render would
  // give `commit` a new identity per render, and a callback that changes every
  // render is a callback that re-runs every effect that holds it.
  const toArray = React.useCallback(
    (input: string | readonly string[] | undefined): string[] => {
      if (input === undefined) return [];
      if (typeof input === "string") return input === "" ? [] : [input];
      return [...input];
    },
    [],
  );
  const mode = React.useMemo(
    () =>
      multiple
        ? {
            emit: (next: readonly string[]) =>
              (onValueChange as ((v: string[]) => void) | undefined)?.([...next]),
            toArray,
          }
        : {
            emit: (next: readonly string[]) =>
              (onValueChange as ((v: string) => void) | undefined)?.(next[next.length - 1] ?? ""),
            toArray,
          },
    [multiple, onValueChange, toArray],
  );

  // `useId` is the only correct source of a DOM id here. A module-level counter
  // breaks under concurrent rendering and across multiple roots, and reading a
  // ref during render is something React 19 explicitly disallows. `useId` gives a
  // stable, SSR-safe id that React itself deduplicates.
  const stem = `tea-combobox-${React.useId().replace(/:/g, "")}`;
  const listboxId = `${stem}-listbox`;

  const [query, setQuery] = React.useState<string>("");
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [selected, setSelected] = React.useState<string[]>(() => mode.toArray(value ?? defaultValue));

  // A controlled value is synced during render rather than in an effect. An
  // effect would paint one frame with the stale selection — a visible flash
  // after a programmatic change — and comparing before writing is React's
  // documented pattern for exactly this.
  const controlledSelection = value === undefined ? undefined : mode.toArray(value);
  if (controlledSelection && !sameSelection(controlledSelection, selected)) {
    setSelected(controlledSelection);
  }

  const isDisabled = field.disabled ?? disabled;
  const isInvalid = field["aria-invalid"] ?? false;

  const matches = React.useMemo(() => filter ?? makeFilter(locale), [filter, locale]);
  const filtered = React.useMemo(
    () => (query.trim() ? options.filter((option) => matches(option, query)) : options),
    [options, query, matches],
  );

  const listRef = React.useRef<HTMLUListElement | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const commit = React.useCallback(
    (option: ComboboxOption) => {
      if (option.disabled) return;
      if (multiple) {
        const next = selected.includes(option.value)
          ? selected.filter((entry) => entry !== option.value)
          : [...selected, option.value];
        setSelected(next);
        // The whole selection, not `next[next.length - 1]`. The old code
        // reported only the value just toggled, which meant a consumer of a
        // multi-select could not reconstruct the selection: it never learned
        // about the other entries, and on a *removal* it was handed a value
        // that was no longer selected at all. `aria-multiselectable` was on the
        // listbox the whole time, so the control claimed a capability its own
        // callback refused to report.
        mode.emit(next);
      } else {
        setSelected([option.value]);
        mode.emit([option.value]);
        setQuery("");
        setOpen(false);
      }
      setActiveIndex(-1);
    },
    [mode, multiple, selected],
  );

  const moveActive = React.useCallback(
    (delta: number) => {
      if (filtered.length === 0) return;
      setActiveIndex((previous) => {
        const next = previous + delta;
        if (next < 0) return filtered.length - 1;
        if (next >= filtered.length) return 0;
        return next;
      });
    },
    [filtered.length],
  );

  // The active option must be scrolled into view, and it must be the element
  // `aria-activedescendant` points at — one index, two consumers, no drift.
  React.useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const node = listRef.current.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const activeId = activeIndex >= 0 ? `${stem}-option-${activeIndex}` : undefined;
  const displayValue = multiple ? selected.map((v) => labelFor(options, v)).join(", ") : labelFor(options, selected[0] ?? "");

  return (
    <div ref={rootRef} className="relative" {...dataSlot("combobox", "root")}>
      <div
        className={cn(comboboxTriggerVariants({ variant }), "cursor-text", className)}
        data-open={open || undefined}
        {...stateAttributes({ disabled: isDisabled, loading, invalid: isInvalid })}
        onClick={() => !isDisabled && setOpen(true)}
      >
        <Search size={16} aria-hidden="true" className="shrink-0 text-fg-muted" />
        <input
          ref={ref}
          id={field.id}
          // The combobox role belongs on the focusable element, which is the
          // input, not on the box drawn around it. It used to sit on this
          // wrapper — a `div` with no tabindex, no focus, and no value — while
          // the input carried `role="searchbox"`. Assistive tech therefore
          // reported the focusable thing as a search box and the combobox as an
          // inert container, and every piece of combobox state
          // (`aria-expanded`, `aria-activedescendant`) lived one element away
          // from the focus that should own it. WAI-ARIA 1.2 is explicit: for an
          // editable combobox the input is the combobox.
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          type="text"
          autoComplete="off"
          // No `outline-none`: this is a real focusable input, and the token
          // layer's global `:focus-visible` ring is what tells a keyboard user
          // where the caret is. The trigger around it carries the border, the
          // ring carries the focus — two signals, two jobs.
          className="min-w-0 flex-1 bg-transparent text-ui text-fg placeholder:text-fg-subtle"
          placeholder={displayValue || label}
          value={query}
          disabled={isDisabled}
          aria-label={label}
          aria-describedby={field["aria-describedby"]}
          aria-invalid={isInvalid || undefined}
          aria-busy={loading || undefined}
          onChange={(event) => {
            setQuery(event.target.value);
            onQueryChange?.(event.target.value);
            setOpen(true);
            setActiveIndex(event.target.value ? 0 : -1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            switch (event.key) {
              case "ArrowDown":
                event.preventDefault();
                if (!open) setOpen(true);
                else moveActive(1);
                break;
              case "ArrowUp":
                event.preventDefault();
                if (!open) setOpen(true);
                else moveActive(-1);
                break;
              case "Home":
                if (open && filtered.length) {
                  event.preventDefault();
                  setActiveIndex(0);
                }
                break;
              case "End":
                if (open && filtered.length) {
                  event.preventDefault();
                  setActiveIndex(filtered.length - 1);
                }
                break;
              case "Enter":
                if (open && activeIndex >= 0 && filtered[activeIndex]) {
                  event.preventDefault();
                  commit(filtered[activeIndex]!);
                }
                break;
              case "Escape":
                // Escape reverts the query before it closes the list. Closing
                // first would leave a visibly empty field with a live query,
                // which reads as data loss.
                if (query) {
                  event.preventDefault();
                  setQuery("");
                  setActiveIndex(-1);
                } else {
                  setOpen(false);
                }
                break;
              default:
                break;
            }
          }}
          {...props}
        />
        {loading ? <span className="text-fg-muted" aria-hidden="true">…</span> : null}
        {query ? (
          <button
            type="button"
            aria-label={clearLabel}
            className="shrink-0 text-fg-muted hover:text-fg"
            onClick={(event) => {
              event.stopPropagation();
              setQuery("");
              onQueryChange?.("");
            }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
        <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-fg-muted" />
      </div>

      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={label}
          aria-multiselectable={multiple || undefined}
          className="absolute z-popover mt-1 max-h-72 w-full overflow-auto border border-line bg-surface-2 p-1 shadow-overlay"
          {...dataSlot("combobox", "listbox")}
        >
          {filtered.length === 0 ? (
            <li role="presentation" className="px-3 py-2 text-micro text-fg-muted">
              {emptyMessage}
            </li>
          ) : null}
          {filtered.map((option, index) => {
            const isSelected = selected.includes(option.value);
            return (
              <li
                key={option.value}
                id={`${stem}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                data-active={index === activeIndex || undefined}
                className={cn(
                  "flex cursor-default select-none flex-col gap-0.5 px-3 py-2 text-ui",
                  "data-[active]:bg-accent-subtle",
                  "data-[active=true]:bg-accent-subtle",
                  option.disabled && "pointer-events-none opacity-50",
                  isSelected && "text-primary",
                )}
                onPointerMove={() => setActiveIndex(index)}
                onClick={() => commit(option)}
              >
                <span className="flex items-center gap-2">
                  {option.label}
                  {isSelected ? <Check size={14} aria-hidden="true" className="shrink-0" /> : null}
                </span>
                {option.description ? (
                  <span className="text-micro text-fg-muted">{option.description}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
});

function sameSelection(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((entry, index) => entry === b[index]);
}

function labelFor(options: readonly ComboboxOption[], value: string): string {
  if (!value) return "";
  return options.find((option) => option.value === value)?.label ?? value;
}
