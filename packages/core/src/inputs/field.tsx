import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cn } from "@tea-ui/utils";
import { COPY } from "@tea-ui/ux-standards";

import { dataSlot, renderElement, stateAttributes } from "../internal";

/**
 * TEA UI — the Field system.
 *
 * This file exists because of a defect the audit found in **four of five**
 * field implementations across the two source projects: a `<label>` that was
 * never associated with its control. The consequence is not subtle — a screen
 * reader user reaches a text field and is told nothing about what belongs in
 * it, and a voice-control user simply cannot fill the form, because there is no
 * name to say. It is also invisible in review, because `<label>` next to
 * `<input>` *looks* right.
 *
 * The fix is structural rather than a review rule. `Field` owns the id space;
 * `FieldLabel`, `FieldDescription` and `FieldError` write into it; and every
 * control calls {@link useFieldControlProps}. A control cannot be wired wrong,
 * because it never writes the wiring by hand:
 *
 * ```tsx
 * <Field invalid={!!error} required>
 *   <FieldLabel>E-Mail</FieldLabel>
 *   <Input type="email" />
 *   <FieldDescription>Wir senden keine Bestätigung.</FieldDescription>
 *   <FieldError>{error}</FieldError>
 * </Field>
 * ```
 *
 * The four parts degrade safely. `FieldError` with no message renders nothing
 * at all, and the error id disappears from `aria-describedby` with it, so there
 * is never a description pointing at an element that does not exist.
 */

/** The state a `Field` passes down to its parts. */
export interface FieldState {
  /** The control holds a value that failed validation. */
  invalid?: boolean | undefined;
  /** The control may not be left empty. */
  required?: boolean | undefined;
  /** The control and everything around it is unavailable. */
  disabled?: boolean | undefined;
  /** The value is visible but not editable. */
  readOnly?: boolean | undefined;
}

export interface FieldContextValue {
  /** Base name of the field, used to build the three ids. */
  name: string;
  /** The control's id. This is what `FieldLabel` points `htmlFor` at. */
  id: string;
  /** Id of the description element, whether or not one is rendered. */
  descriptionId: string;
  /** Id of the error element, whether or not one is rendered. */
  errorId: string;
  isInvalid: boolean;
  isRequired: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
}

/**
 * Which optional parts are actually on screen.
 *
 * Kept out of {@link FieldContextValue} on purpose: it is a rendering detail,
 * not part of the contract a consumer reads, and a consumer that could write to
 * it could desynchronise the ids from the DOM.
 */
interface FieldPartsContextValue {
  hasDescription: boolean;
  hasError: boolean;
  register: (part: "description" | "error", present: boolean) => void;
}

const FieldContext = React.createContext<FieldContextValue | null>(null);
const FieldPartsContext = React.createContext<FieldPartsContextValue | null>(null);

/**
 * Read the enclosing `Field`, or `null` when a control is used standalone.
 *
 * A control outside a `Field` is legal — a search field in a toolbar has
 * nowhere sensible to put a `FieldDescription` — so every control must work
 * without one. That is why this returns `null` rather than throwing.
 */
export function useField(): FieldContextValue | null {
  return React.useContext(FieldContext);
}

/** The subset of a field's context a control needs to wire itself. */
export interface FieldControlProps {
  id: string | undefined;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
  "aria-required": true | undefined;
  disabled: true | undefined;
  readOnly: true | undefined;
}

/**
 * Wire a control to the enclosing `Field`. Call this in **every** control.
 *
 * The returned object is exactly the six attributes a control needs, so a
 * control spreads it and is done:
 *
 * ```tsx
 * const field = useFieldControlProps();
 * return <input {...field} className={…} />;
 * ```
 *
 * `aria-describedby` lists the description *and* the error, in that order. The
 * ids are added only once the corresponding element is really on screen, so the
 * attribute never points at nothing — an `aria-describedby` reference to a
 * missing id is a validation error in axe and is silently dropped by some
 * screen readers, which leaves the error text unannounced.
 *
 * Outside a `Field` every key is `undefined`, so `{...field}` is a no-op and
 * the consumer's own `id` and handlers survive.
 */
export function useFieldControlProps(): FieldControlProps {
  const field = React.useContext(FieldContext);
  const parts = React.useContext(FieldPartsContext);

  if (!field) {
    return {
      id: undefined,
      "aria-describedby": undefined,
      "aria-invalid": undefined,
      "aria-required": undefined,
      disabled: undefined,
      readOnly: undefined,
    };
  }

  const describedBy = [
    parts?.hasDescription ? field.descriptionId : null,
    parts?.hasError ? field.errorId : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    id: field.id,
    "aria-describedby": describedBy || undefined,
    "aria-invalid": field.isInvalid || undefined,
    "aria-required": field.isRequired || undefined,
    disabled: field.isDisabled || undefined,
    readOnly: field.isReadOnly || undefined,
  };
}

export interface FieldProps extends Omit<React.ComponentProps<"div">, "children">, FieldState {
  children?: React.ReactNode;
  /** Render the consumer's single child element instead of a `<div>`. */
  asChild?: boolean | undefined;
  /** The element to render instead of `<div>`. */
  as?: React.ElementType | undefined;
  /**
   * Override the generated id stem. Only needed when the ids must be stable
   * across server and client renders; `React.useId` already is.
   */
  idBase?: string | undefined;
}

/**
 * The container that owns a field's id space and state.
 *
 * Renders a `<div>` by default and nothing else — no role, no landmark. The
 * field is a layout relationship, and inventing a role for it would put a
 * meaningless entry in the screen reader's structure list.
 *
 * @example
 * ```tsx
 * <Field required>
 *   <FieldLabel>Name</FieldLabel>
 *   <Input />
 * </Field>
 * ```
 */
export const Field = React.forwardRef<HTMLDivElement, FieldProps>(function Field(
  {
    children,
    className,
    invalid = false,
    required = false,
    disabled = false,
    readOnly = false,
    asChild = false,
    as,
    idBase,
    ...props
  },
  ref,
) {
  // `useId` emits `:r0:`, which is a legal HTML id but an illegal CSS
  // identifier. A consumer must be able to reach the control with a selector.
  const reactId = React.useId();
  const stem = idBase ?? reactId.replace(/:/g, "");

  const [parts, setParts] = React.useState({ description: false, error: false });

  const register = React.useCallback((part: "description" | "error", present: boolean) => {
    setParts((prev) => (prev[part] === present ? prev : { ...prev, [part]: present }));
  }, []);

  const value = React.useMemo<FieldContextValue>(
    () => ({
      name: stem,
      id: `${stem}-control`,
      descriptionId: `${stem}-description`,
      errorId: `${stem}-error`,
      isInvalid: invalid,
      isRequired: required,
      isDisabled: disabled,
      isReadOnly: readOnly,
    }),
    [stem, invalid, required, disabled, readOnly],
  );

  const partsValue = React.useMemo<FieldPartsContextValue>(
    () => ({ hasDescription: parts.description, hasError: parts.error, register }),
    [parts, register],
  );

  return (
    <FieldContext.Provider value={value}>
      <FieldPartsContext.Provider value={partsValue}>
        {renderElement(
          {
            asChild,
            as,
            className: cn("flex min-w-0 flex-col gap-2", className),
            children,
            ref,
            ...stateAttributes({ disabled, invalid, readOnly }),
            ...dataSlot("field"),
            ...props,
          },
          "div",
        )}
      </FieldPartsContext.Provider>
    </FieldContext.Provider>
  );
});


export interface FieldLabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {
  /**
   * Render the required marker. Defaults to the enclosing `Field`'s `required`;
   * set it explicitly to label a field as required outside one.
   */
  required?: boolean | undefined;
}

/**
 * The field's label. A real `<label>` with `htmlFor` pointing at the control.
 *
 * Uses `Label.Root` from `radix-ui` rather than a bare `<label>` so that
 * clicking the label activates the control even when the control is a Radix
 * primitive rendering a `<button>` rather than an `<input>`.
 *
 * The required marker is a visible, `aria-hidden` `*` with a `title`, and the
 * requirement itself is carried by the control's `required` / `aria-required`.
 * It is deliberately **not** a visually hidden "Pflichtfeld" word inside the
 * label: that would append to the control's accessible name, so the control
 * would be announced as "E-Mail Pflichtfeld" instead of "E-Mail", and a
 * consumer matching on the visible label would find nothing. The attribute
 * already says it, and it says it correctly.
 *
 * @example
 * ```tsx
 * <FieldLabel required>E-Mail</FieldLabel>
 * ```
 */
export const FieldLabel = React.forwardRef<HTMLLabelElement, FieldLabelProps>(function FieldLabel(
  { children, className, required, htmlFor, ...props },
  ref,
) {
  const field = useField();
  const isRequired = required ?? field?.isRequired ?? false;

  return (
    <LabelPrimitive.Root
      ref={ref}
      htmlFor={htmlFor ?? field?.id}
      className={cn("inline-flex items-center gap-1 text-ui font-medium text-fg", className)}
      {...dataSlot("field-label")}
      {...props}
    >
      {children}
      {isRequired ? (
        <span aria-hidden="true" className="text-critical" title={COPY.states.required}>
          *
        </span>
      ) : null}
    </LabelPrimitive.Root>
  );
});

/**
 * Record which optional parts are mounted, so `aria-describedby` never points
 * at an element that is not there.
 *
 * Registration happens in an effect, not during render, because it changes the
 * field's state and rendering must stay side-effect free.
 */
function useFieldPart(part: "description" | "error", present: boolean): void {
  const parts = React.useContext(FieldPartsContext);
  const register = parts?.register;
  React.useEffect(() => {
    register?.(part, present);
    return () => register?.(part, false);
  }, [register, part, present]);
}

export type FieldDescriptionProps = React.ComponentProps<"p">;

/**
 * Help text for the field, associated through `aria-describedby`.
 *
 * @example
 * ```tsx
 * <FieldDescription>Nur Großbuchstaben, Zahlen und Bindestriche.</FieldDescription>
 * ```
 */
export const FieldDescription = React.forwardRef<HTMLParagraphElement, FieldDescriptionProps>(
  function FieldDescription({ children, className, ...props }, ref) {
    const field = useField();
    const present = children !== null && children !== undefined && children !== false;
    useFieldPart("description", present);

    if (!present || !field) return null;

    return (
      <p
        ref={ref}
        id={field.descriptionId}
        className={cn("text-micro text-fg-muted", className)}
        {...dataSlot("field-description")}
        {...props}
      >
        {children}
      </p>
    );
  },
);

export interface FieldErrorProps extends Omit<React.ComponentProps<"p">, "children"> {
  /**
   * The error text. `null`, `undefined` and `false` render nothing, which is
   * what lets a caller write `<FieldError>{error}</FieldError>` and leave it in
   * the tree permanently.
   */
  children?: React.ReactNode;
}

/**
 * The field's error message: `role="alert"`, so it is announced when it appears.
 *
 * A colour change is not an announcement. Without `role="alert"` a validation
 * error is invisible to a screen reader user, who is left with a red box and no
 * idea what is wrong with what they just typed.
 *
 * Renders nothing when there is no message — including when it is inside a
 * `Field` and therefore participates in `aria-describedby`.
 *
 * @example
 * ```tsx
 * <FieldError>{errors.email}</FieldError>
 * ```
 */
export const FieldError = React.forwardRef<HTMLParagraphElement, FieldErrorProps>(function FieldError(
  { children, className, ...props },
  ref,
) {
  const field = useField();
  const present =
    children !== null && children !== undefined && children !== false && children !== "";

  useFieldPart("error", present);

  if (!present || !field) return null;

  return (
    <p
      ref={ref}
      id={field.errorId}
      role="alert"
      className={cn("text-micro font-medium text-critical", className)}
      {...dataSlot("field-error")}
      {...props}
    >
      {children}
    </p>
  );
});

export interface FieldGroupProps extends Omit<React.ComponentProps<"fieldset">, "children"> {
  children?: React.ReactNode;
  /**
   * The group's label. Rendered as the `<legend>`, which is what associates the
   * set of controls with a name — `aria-label` on a `<fieldset>` does not
   * become the group's accessible name in every browser.
   */
  legend?: React.ReactNode;
  /** Help text for the whole set, associated with the `<fieldset>`. */
  description?: React.ReactNode;
}

/**
 * A named set of related controls: `<fieldset>` + `<legend>`.
 *
 * A native `<fieldset disabled>` also disables every form control inside it,
 * which is the cheapest possible "these five settings are not editable" — a
 * `<fieldset>` in a `<form>` participates in form semantics that a `div` cannot.
 *
 * One component rather than `FieldSet` + `FieldLegend`: a legend is required
 * for the fieldset to be named, so separating them produces an unnamed group
 * whenever the legend is forgotten. The audit found plenty of those.
 *
 * @example
 * ```tsx
 * <FieldGroup legend="Benachrichtigungen" disabled={saving}>
 *   <Field>
 *     <FieldLabel>Fehler per E-Mail</FieldLabel>
 *     <Switch />
 *   </Field>
 * </FieldGroup>
 * ```
 */
export const FieldGroup = React.forwardRef<HTMLFieldSetElement, FieldGroupProps>(function FieldGroup(
  { children, className, legend, description, disabled, ...props },
  ref,
) {
  const descriptionId = React.useId().replace(/:/g, "");

  return (
    <fieldset
      ref={ref}
      disabled={disabled}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        "flex min-w-0 flex-col field-gap",
        "disabled:opacity-50",
        className,
      )}
      {...stateAttributes({ disabled })}
      {...dataSlot("field-group")}
      {...props}
    >
      {/* The legend must be the fieldset's first child: HTML names the set from
          the first legend, and a legend that is not first names nothing. */}
      {legend ? (
        <legend className="mb-1 text-ui font-semibold text-fg" {...dataSlot("field-legend")}>
          {legend}
        </legend>
      ) : null}
      {description ? (
        <p id={descriptionId} className="-mt-1 text-micro text-fg-muted">
          {description}
        </p>
      ) : null}
      {children}
    </fieldset>
  );
});
