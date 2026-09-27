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

export interface ComboboxProps
  extends Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "onSelect" | "size">,
    Omit<VariantProps<typeof comboboxTriggerVariants>, "size"> {
  /** The accessible name. Required — the search icon is not a label. */
  label: string;
  options: readonly ComboboxOption[];
  /** The controlled value. */
  value?: string | undefined;
  /** The uncontrolled initial value. */
  defaultValue?: string | undefined;
  /** Called with the emitted `value` of the chosen option. */
  onValueChange?: ((value: string) => undefined | void) | undefined;
  /** Called on every keystroke, with the raw query. */
  onQueryChange?: ((query: string) => void) | undefined;
  /**
   * Filtering. Defaults to a case- and diacritic-insensitive substring match
   * over the label, so a product that needs fuzzy search opts in rather than
   * getting it by accident.
   */
  filter?: ((option: ComboboxOption, query: string) => boolean) | undefined;
  /** Shown when the query matches nothing. */
  emptyMessage?: string | undefined;
  /** A search is running. Shows a spinner and sets `aria-busy`. */
  loading?: boolean | undefined;
  /** Disable the whole control. */
  disabled?: boolean | undefined;
  /** Allow choosing more than one option. */
  multiple?: boolean | undefined;
  className?: string | undefined;
}

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

const DEFAULT_FILTER = (option: ComboboxOption, query: string): boolean => {
  const needle = query.trim().toLocaleLowerCase("de");
  if (!needle) return true;
  return option.label.toLocaleLowerCase("de").includes(needle);
};

/** Stable, id-safe DOM ids for one listbox. */
let comboboxSeq = 0;

export const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
  {
    label,
    options,
    value,
    defaultValue,
    onValueChange,
    onQueryChange,
    filter = DEFAULT_FILTER,
    emptyMessage = "Keine Treffer",
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
  const idRef = React.useRef<string>("");
  if (!idRef.current) {
    comboboxSeq += 1;
    idRef.current = `tea-combobox-${comboboxSeq}`;
  }
  const listboxId = `${idRef.current}-listbox`;

  const [query, setQuery] = React.useState<string>("");
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [selected, setSelected] = React.useState<string[]>(() =>
    value !== undefined ? [value] : defaultValue !== undefined ? [defaultValue] : [],
  );

  // A controlled consumer owns the selection; sync without touching the input's
  // query, so a programmatic selection never rewrites what the user is typing.
  React.useEffect(() => {
    if (value !== undefined) setSelected(value === "" ? [] : [value]);
  }, [value]);

  const isDisabled = field.disabled ?? disabled;
  const isInvalid = field["aria-invalid"] ?? false;

  const filtered = React.useMemo(
    () => (query.trim() ? options.filter((option) => filter(option, query)) : options),
    [options, query, filter],
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
        onValueChange?.(next[next.length - 1] ?? "");
      } else {
        setSelected([option.value]);
        onValueChange?.(option.value);
        setQuery("");
        setOpen(false);
      }
      setActiveIndex(-1);
    },
    [multiple, onValueChange, selected],
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

  const activeId = activeIndex >= 0 ? `${idRef.current}-option-${activeIndex}` : undefined;
  const displayValue = multiple ? selected.map((v) => labelFor(options, v)).join(", ") : labelFor(options, selected[0] ?? "");

  return (
    <div ref={rootRef} className="relative" {...dataSlot("combobox", "root")}>
      <div
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-owns={listboxId}
        className={cn(comboboxTriggerVariants({ variant }), "cursor-text", className)}
        data-open={open || undefined}
        {...stateAttributes({ disabled: isDisabled, loading, invalid: isInvalid })}
        onClick={() => !isDisabled && setOpen(true)}
      >
        <Search size={16} aria-hidden="true" className="shrink-0 text-fg-muted" />
        <input
          ref={ref}
          id={field.id}
          role="searchbox"
          type="text"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-ui text-fg outline-none placeholder:text-fg-subtle"
          placeholder={displayValue || label}
          value={query}
          disabled={isDisabled}
          aria-label={label}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
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
            aria-label="Suche leeren"
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
                id={`${idRef.current}-option-${index}`}
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

function labelFor(options: readonly ComboboxOption[], value: string): string {
  if (!value) return "";
  return options.find((option) => option.value === value)?.label ?? value;
}
