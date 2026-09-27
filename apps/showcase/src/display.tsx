import * as React from "react";
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
  tea: "Default (tea)",
  hsm: "HomeServerManager",
  lutea: "LUTEA Design",
};

const DENSITY_LABEL: Record<Density, string> = {
  compact: "Kompakt",
  default: "Standard",
  comfortable: "Komfortabel",
};

/**
 * Switches the whole system between the three reference themes and the three
 * densities. This control is the demonstration: nothing below it re-renders with
 * a different class, and no component knows a theme exists.
 */
export function ThemeControls(): React.ReactElement {
  const { theme, density, setTheme, setDensity } = useDisplay();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div role="radiogroup" aria-label="Design-Theme" className="flex border border-line">
        {THEMES.map((entry) => (
          <button
            key={entry}
            type="button"
            role="radio"
            aria-checked={theme === entry}
            onClick={() => setTheme(entry)}
            className={
              theme === entry
                ? "bg-accent-subtle px-2.5 py-1 text-micro font-medium text-accent"
                : "px-2.5 py-1 text-micro text-fg-muted transition-colors hover:text-fg"
            }
          >
            {THEME_LABEL[entry]}
          </button>
        ))}
      </div>
      <div role="radiogroup" aria-label="Informationsdichte" className="flex border border-line">
        {DENSITIES.map((entry) => (
          <button
            key={entry}
            type="button"
            role="radio"
            aria-checked={density === entry}
            onClick={() => setDensity(entry)}
            className={
              density === entry
                ? "bg-accent-subtle px-2.5 py-1 text-micro font-medium text-accent"
                : "px-2.5 py-1 text-micro text-fg-muted transition-colors hover:text-fg"
            }
          >
            {DENSITY_LABEL[entry]}
          </button>
        ))}
      </div>
    </div>
  );
}
