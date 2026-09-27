import * as React from "react";
import { Search, X } from "@tea-ui/icons";
import { cn } from "@tea-ui/utils";
import { COPY } from "@tea-ui/ux-standards";

import { dataSlot, useControllableState, withPrivateRef } from "../internal";
import { Spinner } from "../feedback/spinner";
import { IconButton } from "./icon-button";
import { Input, type InputProps } from "./input";
import { InputGroup, InputGroupEnd, InputGroupStart } from "./input-group";

/**
 * TEA UI — SearchInput.
 *
 * An input, a decorative search icon and a clear button, already wired
 * together. The audit found three of these hand-typed, each with its own
 * opinion about the icon's size and position, and not one clear button with a
 * name.
 *
 * What this component decides once, for everybody:
 *
 *  - **The icon is decorative.** A magnifier is not a name. It is
 *    `aria-hidden`, and the accessible name comes from `label` — required, for
 *    the same reason it is on `IconButton`.
 *  - **The clear button has a name, and it only exists when there is something
 *    to clear.** A permanently present, permanently disabled clear button is a
 *    target a user aims at twice.
 *  - **Enter submits; Escape is left alone.** Escape is the browser's "revert
 *    this field" gesture, and taking it over to close a search box strands the
 *    user mid-query with a field that looks empty and is not.
 */
export interface SearchInputProps
  extends Omit<InputProps, "value" | "defaultValue" | "onChange" | "type" | "size" | "onSubmit"> {
  /** The accessible name. **Required** — the icon is not a label. */
  label: string;
  /** Controlled query. */
  value?: string | undefined;
  /** Uncontrolled initial query. */
  defaultValue?: string | undefined;
  /** Called on every keystroke, in both controlled and uncontrolled mode. */
  onValueChange?: ((value: string) => void) | undefined;
  /** Called when the user presses Enter with a non-empty query. */
  onSubmit?: ((value: string) => void) | undefined;
  /**
   * A search is running. Swaps the icon for a spinner and sets `aria-busy`; it
   * deliberately does **not** disable the field, because a user who is still
   * typing the query must be able to finish typing it.
   */
  loading?: boolean | undefined;
  /** Offer a clear button. On by default. */
  clearable?: boolean | undefined;
  /** Name for the clear button. Defaults to `COPY.actions.reset`. */
  clearLabel?: string | undefined;
  /** The control height. */
  size?: InputProps["size"];
  className?: string | undefined;
}

/**
 * @example
 * ```tsx
 * <SearchInput
 *   label="Server durchsuchen"
 *   placeholder="Name, IP oder Hostname"
 *   value={query}
 *   onValueChange={setQuery}
 *   onSubmit={run}
 *   loading={isSearching}
 * />
 * ```
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      label,
      value,
      defaultValue = "",
      onValueChange,
      onSubmit,
      loading = false,
      clearable = true,
      clearLabel,
      size,
      disabled,
      readOnly,
      className,
      ...props
    },
    ref,
  ) {
    const [query, setQuery] = useControllableState({
      value,
      defaultValue,
      onChange: onValueChange,
      name: "SearchInput",
    });

    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const canClear = clearable && query.length > 0 && !loading && !disabled && !readOnly;

    return (
      <InputGroup label={label} className={cn(className)} {...dataSlot("search-input")}>
        <InputGroupStart>
          {loading ? (
            <Spinner size="sm" label={COPY.states.loading} className="-ms-1" />
          ) : (
            <Search aria-hidden="true" className="size-4" />
          )}
        </InputGroupStart>
        {/* `type="search"` already carries the implicit `searchbox` role and the
            native clear affordance; the role is not restated. */}
        <Input
          ref={withPrivateRef(ref, undefined, inputRef)}
          type="search"
          size={size}
          aria-label={label}
          aria-busy={loading || undefined}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && query.length > 0) {
              // The query belongs to the consumer, not to a form, so Enter must
              // not also submit an enclosing `<form>` by accident.
              event.preventDefault();
              onSubmit?.(query);
            }
          }}
          disabled={disabled}
          readOnly={readOnly}
          {...props}
        />
        {canClear ? (
          <InputGroupEnd>
            <IconButton
              label={clearLabel ?? COPY.actions.reset}
              size="sm"
              onClick={() => {
                setQuery("");
                // Focus goes back to the field, because the button that held it
                // is about to disappear. Focus falling to `<body>` sends a
                // keyboard user back to the top of the document.
                inputRef.current?.focus();
              }}
            >
              <X />
            </IconButton>
          </InputGroupEnd>
        ) : null}
      </InputGroup>
    );
  },
);
