/**
 * TEA UI — UX Standards.
 *
 * Standards are only real when something enforces them. This package is that
 * something: the vocabulary every other TEA UI package imports instead of
 * re-deriving. A component asks the registry for a status label; a dialog asks
 * the destructive policy what protection it needs; an error surface asks the
 * anatomy type for its four answers.
 *
 * If a rule here is inconvenient, the rule is what changes — not the call
 * site. That inversion is the entire point of the layer.
 */

export {
  STATUS,
  statusMeta,
  statusEntries,
  statusKeysWithTone,
  resourceStatusMeta,
  type StatusMeta,
  type StatusDomain,
  type StatusKey,
  type AnyStatusKey,
  type ResourceStatus,
  type ResourceStatusRender,
} from "./status";

/* The tone vocabulary is defined in the token layer — a theme colours it, the
 * standards layer names it — and re-exported here so a product reasoning about
 * status has one import for the whole vocabulary. */
export { TONES, type Tone } from "@tea-ui/tokens";

export {
  FEEDBACK,
  FEEDBACK_STATES,
  NON_DESTRUCTIVE_STATES,
  feedbackMeta,
  feedbackAttr,
  isNonDestructive,
  type FeedbackState,
  type FeedbackKind,
  type FeedbackMeta,
  type NonDestructiveState,
} from "./feedback";

export {
  DESTRUCTIVE_POLICY,
  DESTRUCTIVE_VERBS,
  CONSEQUENCE_LEVELS,
  destructivePolicy,
  consequenceSentence,
  type ConsequenceLevel,
  type DestructivePolicy,
  type Protection,
} from "./destructive";

export {
  ERROR_TITLES,
  renderErrorMessage,
  shouldOfferRetry,
  hasTechnicalDetail,
  toErrorAnatomy,
  type ErrorAnatomy,
  type ErrorKind,
  type ErrorRecovery,
} from "./error-anatomy";

export {
  AUTOCOMPLETE,
  FIELD_RULES,
  FORM_INTERACTION,
  UNSAVED_CHANGES,
  VALIDATION_TIMING,
  type FieldControl,
  type FormFieldRules,
} from "./forms";

export {
  COPY,
  FORBIDDEN_COPY,
  REGISTER,
  fill,
  type Register,
} from "./terminology";

export {
  IA_LIMITS,
  NAVIGATION_RULES,
  NAVIGATION_MECHANISMS,
  URL_SYNC,
  type InformationArchitecture,
  type NavigationMechanism,
  type NavigationRule,
} from "./navigation";

export {
  BACKGROUND_OPERATION,
  DATA_VIZ,
  EMPTY_STATE_TITLES,
  LOADING_AFFORDANCE,
  MIN_SKELETON_MS,
  MOTION,
  MOTION_PURPOSE,
  REDUCED_MOTION,
  TRANSITION_PATTERNS,
  type DataVizRules,
  type EmptyStateAnatomy,
  type EmptyStateTitle,
  type MotionPurpose,
} from "./motion";

/* The density vocabulary lives in the token layer, because it is expressed in
 * CSS custom properties. It is re-exported here so a product that reasons about
 * UX Standards has one import for the whole vocabulary. */
export {
  DENSITIES,
  DEFAULT_DENSITY,
  isDensity,
  type Density,
} from "@tea-ui/tokens";
