/**
 * TEA UI — form standards.
 *
 * The audit found the same form field implemented five times in one project and
 * three times in the other, with four of the five using a `<label>` that was
 * never associated with its control — so most inputs in both products had no
 * accessible name at all. These constants are what make a field correct by
 * default rather than by remembering.
 */

export type FieldControl =
  | "text"
  | "email"
  | "password"
  | "search"
  | "number"
  | "date"
  | "time"
  | "url"
  | "tel"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "switch"
  | "slider"
  | "file"
  | "otp";

/**
 * When validation runs. "Too eager" and a form nobody can finish are the same
 * defect, so the default is: validate on blur, re-validate on change *after*
 * the field has been touched, and validate on submit. Never on every keystroke
 * from the first character.
 */
export const VALIDATION_TIMING = {
  onSubmit: "always",
  onBlur: true,
  onChangeAfterTouched: true,
  onChangeFromFirstKeystroke: false,
} as const;

export interface FormFieldRules {
  /** The control type, which decides the association and keyboard contract. */
  readonly control: FieldControl;
  /** `htmlFor` is mandatory. A label without it does not name the control. */
  readonly requiresLabelAssociation: true;
  /** A description must be linked with `aria-describedby`, not merely placed nearby. */
  readonly requiresDescribedBy: true;
  /** An error must be linked with `aria-describedby` AND announced. */
  readonly requiresErrorAnnouncement: true;
  /** Icon-only controls require an accessible name. */
  readonly requiresAccessibleName: true;
  /** Required state must be conveyed programmatically, not only with an asterisk. */
  readonly requiresRequiredState: true;
}

export const FIELD_RULES: Readonly<Record<FieldControl, FormFieldRules>> = {
  text: base("text"),
  email: base("email"),
  password: base("password"),
  search: base("search"),
  number: base("number"),
  date: base("date"),
  time: base("time"),
  url: base("url"),
  tel: base("tel"),
  textarea: base("textarea"),
  select: base("select"),
  checkbox: base("checkbox"),
  radio: base("radio"),
  switch: base("switch"),
  slider: base("slider"),
  file: base("file"),
  otp: base("otp"),
};

function base(control: FieldControl): FormFieldRules {
  return {
    control,
    requiresLabelAssociation: true,
    requiresDescribedBy: true,
    requiresErrorAnnouncement: true,
    requiresAccessibleName: true,
    requiresRequiredState: true,
  };
}

/**
 * `autocomplete` tokens. Auto-fill is an accessibility feature, not a
 * convenience: without it a user relying on a password manager has to type
 * what the browser already knows.
 */
export const AUTOCOMPLETE = {
  name: "name",
  givenName: "given-name",
  familyName: "family-name",
  email: "email",
  username: "username",
  currentPassword: "current-password",
  newPassword: "new-password",
  oneTimeCode: "one-time-code",
  organization: "organization",
  streetAddress: "street-address",
  postalCode: "postal-code",
  addressLevel1: "address-level1",
  addressLevel2: "address-level2",
  country: "country",
  tel: "tel",
  url: "url",
  newPasswordConfirm: "new-password",
} as const;

/**
 * The unsaved-changes standard. Losing typed input to a navigation is a data
 * loss bug, so the guard is mandatory wherever a form can be abandoned — and
 * it is a TEA UI pattern, not something each product re-implements.
 */
export const UNSAVED_CHANGES = {
  /**
   * Wording of the guard.
   *
   * These are the values a consumer gets by default, so they are English — the
   * language this package documents itself in. `UNSAVED_CHANGES` is `as const`,
   * not frozen against override: spread it and set `title`/`detail`/
   * `confirmLabel`/`cancelLabel` at the entry point, which is the intended way
   * to localise a whole dialog. The button order (`preferSave`) is the part that
   * matters for usability, and that is what the tests assert.
   */
  title: "Unsaved changes",
  detail: "Your changes have not been saved. If you leave this page, they will be lost.",
  confirmLabel: "Discard and leave",
  cancelLabel: "Keep editing",
  /** Saving before navigating is the better path, so it is offered first. */
  preferSave: true,
} as const;

/** Paste is never blocked. Masking an input must not break paste. */
export const FORM_INTERACTION = {
  blockPaste: false,
  blockAutofill: false,
  /** Multi-step forms must allow going back without losing input. */
  allowStepBack: true,
  /** Validation must be correctable: a field the user cannot fix is a bug. */
  allowFixingErrors: true,
} as const;
