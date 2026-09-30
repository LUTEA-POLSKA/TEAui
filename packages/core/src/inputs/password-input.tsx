import * as React from "react";
import { Eye, EyeOff } from "@tea-ui/icons";
import { cn } from "@tea-ui/utils";

import { dataSlot, useControllableState, withPrivateRef } from "../internal";
import { IconButton } from "./icon-button";
import { Input, type InputProps } from "./input";
import { InputGroup, InputGroupEnd } from "./input-group";

/**
 * TEA UI — PasswordInput.
 *
 * A password field with a show/hide toggle. Three decisions:
 *
 *  - **`aria-pressed`, not just an icon swap.** A toggle that only changes which
 *    glyph is on screen tells a screen reader user nothing about the state. The
 *    button reports whether the password is *currently* visible, and its name
 *    says what pressing it will do.
 *  - **The name says the effect, not the state.** "Passwort anzeigen" while
 *    hidden, "Passwort verbergen" while shown. A button labelled "Anzeigen"
 *    that sometimes hides is a button nobody trusts.
 *  - **Paste is never blocked.** A password manager fills this field by
 *    pasting. A `onPaste` handler that refuses a paste — a pattern the source
 *    project shipped — breaks every password manager on the planet, and is a
 *    security control that does not measure security: a password in the
 *    clipboard is a password the user chose to copy.
 */
export interface PasswordInputProps
  extends Omit<InputProps, "type" | "value" | "defaultValue" | "onChange" | "size"> {
  /** Controlled value. */
  value?: string | undefined;
  /** Uncontrolled initial value. */
  defaultValue?: string | undefined;
  /** Called on every keystroke, in both controlled and uncontrolled mode. */
  onValueChange?: ((value: string) => void) | undefined;
  /**
   * Start with the password visible. Almost always `false`; it exists for the
   * one-time-secret case, and for tests.
   */
  visible?: boolean | undefined;
  /** Uncontrolled initial visibility. */
  defaultVisible?: boolean | undefined;
  /** Called whenever the visibility flips. */
  onVisibleChange?: ((visible: boolean) => void) | undefined;
  /**
   * Defaults to `current-password`, the only value a browser password manager
   * will offer to fill. Override with `new-password` on a registration form —
   * leaving it as `current-password` there is why managers offer the *old*
   * password for a *new* one.
   */
  autoComplete?: string | undefined;
  /** Name for the toggle while the password is hidden. */
  showLabel?: string | undefined;
  /** Name for the toggle while the password is visible. */
  hideLabel?: string | undefined;
  /** The control height. */
  size?: InputProps["size"];
  className?: string | undefined;
}

/** No German string for these exists in `COPY`, so they are typed here. */
const DEFAULT_SHOW_LABEL = "Show password";
const DEFAULT_HIDE_LABEL = "Hide password";

/**
 * @example
 * ```tsx
 * <Field>
 *   <FieldLabel>Password</FieldLabel>
 *   <PasswordInput autoComplete="new-password" />
 * </Field>
 * ```
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      value,
      defaultValue = "",
      onValueChange,
      visible,
      defaultVisible = false,
      onVisibleChange,
      autoComplete = "current-password",
      showLabel = DEFAULT_SHOW_LABEL,
      hideLabel = DEFAULT_HIDE_LABEL,
      size,
      className,
      disabled,
      readOnly,
      ...props
    },
    ref,
  ) {
    const [password, setPassword] = useControllableState({
      value,
      defaultValue,
      onChange: onValueChange,
      name: "PasswordInput",
    });
    const [isVisible, setIsVisible] = useControllableState({
      value: visible,
      defaultValue: defaultVisible,
      onChange: onVisibleChange,
      name: "PasswordInput.visible",
    });

    const inputRef = React.useRef<HTMLInputElement | null>(null);

    return (
      <InputGroup className={cn(className)} {...dataSlot("password-input")}>
        <Input
          ref={withPrivateRef(ref, undefined, inputRef)}
          type={isVisible ? "text" : "password"}
          size={size}
          autoComplete={autoComplete}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          {...props}
        />
        <InputGroupEnd>
          <IconButton
            label={isVisible ? hideLabel : showLabel}
            aria-pressed={isVisible}
            size="sm"
            disabled={disabled}
            onClick={() => setIsVisible(!isVisible)}
          >
            {isVisible ? <EyeOff /> : <Eye />}
          </IconButton>
        </InputGroupEnd>
      </InputGroup>
    );
  },
);
