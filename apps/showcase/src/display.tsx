import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "@tea-ui/core";
import { DENSITIES, THEMES, type Density, type ThemeName } from "@tea-ui/tokens";

/**
 * Theme and density, as application state.
 *
 * Both are set as **attributes**, not as React context: `data-theme` and
 * `data-density` are inspectable from the DOM, survive SSR, and let a
 * Showcase switch the entire system by mutating one element — which is the
 * proof that the same API really does produce different visual identities.
 */

interface DisplayContextValue {
  theme: ThemeName;
  density: Density;
  setTheme: (theme: ThemeName) => void;
  setDensity: (density: Density) => void;
}

const DisplayContext = React.createContext<DisplayContextValue | null>(null);

export function DisplayProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [theme, setThemeState] = React.useState<ThemeName>("tea");
  const [density, setDensityState] = React.useState<Density>("default");

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
  }, [density]);

  const value = React.useMemo<DisplayContextValue>(
    () => ({ theme, density, setTheme: setThemeState, setDensity: setDensityState }),
    [theme, density],
  );

  return <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>;
}

export function useDisplay(): DisplayContextValue {
  const value = React.useContext(DisplayContext);
  if (!value) throw new Error("useDisplay must be used inside <DisplayProvider>");
  return value;
}

/* -------------------------------------------------------------------------- */

const THEME_LABEL: Record<ThemeName, string> = {
  tea: "tea",
  pop: "pop",
  ton: "ton",
};

const DENSITY_LABEL: Record<Density, string> = {
  compact: "Compact",
  default: "Default",
  comfortable: "Comfortable",
};

/**
 * The theme switcher. This is the demonstration: nothing below it re-renders
 * with a different class, and no component knows a theme exists — the whole
 * system turns because one attribute on `<html>` changed.
 *
 * It is built from TEA UI's own `ToggleGroup` in `single` mode, and that is not
 * a detail. This control used to be a hand-rolled `role="radiogroup"` with
 * `role="radio"` buttons on the inside: it *announced* the radio pattern while
 * implementing three plain buttons — every one of them in the tab order and no
 * arrow-key support, which is the one thing a radio group exists to provide. It
 * is the same class of defect the audit found in the source products, in a
 * component whose entire job is to be the correct reference. Radix supplies the
 * real pattern, so the Showcase gets it by using the library instead of
 * imitating it.
 *
 * Themes only. Density lives in the Playground, where tuning things happens;
 * six controls on a 56px header next to the navigation is a crowd, and a
 * control nobody reaches is not a control.
 *
 * **One box, and the selected item in the secondary colour.** Both decisions
 * came from looking at the rendered result rather than from the API, and both
 * were wrong before:
 *
 * The group draws a single border and the items draw none, so the control reads
 * as one segmented field instead of three separate buttons. Three boxes in a
 * 56px strip is a lot of line for a secondary control in a row that otherwise
 * has none — the header's own rule is a single `border-b`.
 *
 * The selected item is marked with `accent`, not `primary`, and that is not a
 * taste call. The navigation marks the current page with `text-accent`, so
 * `primary` here put two different "you are here" colours in one header row.
 * In `tea` they are the same gold and the mistake is invisible. In `pop` the
 * active link is Flickr Pink and the active switcher item is Sky Blue; in `ton`
 * it is Ruby against Vermillion. The palette swap made a colour decision
 * visible that the default theme had been hiding.
 *
 * The overrides are all same-group conflicts, so `cn`'s tailwind-merge resolves
 * them deterministically in the caller's favour — `className` is merged after
 * the variant classes, and `border-0` competes with `border`, `border-transparent`
 * with `border-line`. Nothing here depends on the order two rules happen to
 * appear in the stylesheet.
 *
 * The item borders stay on the items. Drawing one box on the group and
 * stripping them was tried and reverted: it removed the separation between the
 * options, and it also removed the thing `ToggleGroup`'s `[&>*+*]:-ms-px` is
 * built for — collapsing two adjacent borders into one line. Without a border to
 * collapse, that rule just pulled every option 1px into its neighbour.
 *
 * The items get `control-px + 0.25rem` of inline padding so a label does not sit
 * against its own outline. It is derived from the token rather than set to a
 * fixed 16px so the extra room survives a density change: compact is 10px + 4px,
 * comfortable 14px + 4px. A hardcoded padding would be the one measurement in
 * the header that ignores the setting it sits in.
 */
export function ThemeControls(): React.ReactElement {
  const { theme, setTheme } = useDisplay();
  return (
    <ToggleGroup
      type="single"
      value={theme}
      onValueChange={(next: string) => {
        // Radix reports an empty string when the pressed item is released. The
        // theme is not optional, so that transition is ignored rather than
        // writing `data-theme=""` and leaving the system on no palette at all.
        if (next) setTheme(next as ThemeName);
      }}
      aria-label="Design theme"
      selection="outline"
      indicator
      // No frame, no `border-0`, no muted idle items. `selection="outline"`
      // means the group draws one outline and the items draw none, so the
      // component provides the frame, the item borders and the text contrast
      // that keeps the pressed state readable without a fill. This switcher used
      // to spell all three out here, which is the tell that the library was
      // shipping a selection style that only looked right where the recipe was
      // known.
    >
      {THEMES.map((entry) => (
        <ToggleGroupItem key={entry} value={entry} className="px-4">
          {THEME_LABEL[entry]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** The density control, rendered in the Playground rather than the header. */
export function DensityControls(): React.ReactElement {
  const { density, setDensity } = useDisplay();
  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={density}
      onValueChange={(next: string) => {
        if (next) setDensity(next as Density);
      }}
      aria-label="Information density"
      // The same Outline treatment as the theme switcher: both are controls
      // over the display system, and one of them painting its selection in the
      // action colour would make "which of these two is a setting" the more
      // visible question in the Playground.
      selection="outline"
    >
      {DENSITIES.map((entry) => (
        <ToggleGroupItem key={entry} value={entry}>
          {DENSITY_LABEL[entry]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
