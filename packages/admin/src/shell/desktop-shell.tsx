import * as React from "react";
import { Copy, Maximize2, Minus, X } from "@tea-ui/icons";
import {
  Box,
  HStack,
  IconButton,
  Sidebar,
  SkipLink,
  type NavItemData,
  type SidebarContentProps,
} from "@tea-ui/core";
import { cn } from "@tea-ui/utils";
import { COPY } from "@tea-ui/ux-standards";

/**
 * TEA UI Admin — DesktopShell.
 *
 * The application shell for a product that is **a window**, not a tab.
 *
 * ### Why this is not AdminShell with a prop
 *
 * `AdminShell` is built for a browser, and a browser tab has no title bar. Its
 * top band therefore holds the page's own controls, and the brand sits in a
 * separate band above the navigation. Both are correct there.
 *
 * A desktop window with `decorations: false` has neither. The window *is* the
 * viewport, so:
 *
 * - **The brand and the controls belong in one band.** Two bands stacked at the
 *   top of a window is the "double header" this component exists to remove, and
 *   merging them is a structural change rather than a styling one: there is no
 *   brand band above the navigation, and no top bar above the page.
 * - **The band is the drag region.** `data-tauri-drag-region` makes the whole
 *   strip draggable, which is what a user expects when they grab empty space in
 *   a title bar. Every interactive child carries `data-tauri-drag-region="false"`,
 *   because a button inside a drag region swallows the click that drags the
 *   window instead of pressing it.
 * - **The window does not scroll.** `AdminShell` uses `min-h-dvh` and lets the
 *   document scroll. A window has no document to scroll, so this is `h-dvh`
 *   with the scroll inside `<main>` — which also means a sticky page header now
 *   sticks to the window rather than to the viewport of a browser tab.
 *
 * ### macOS is not a styling variant
 *
 * With `titleBarStyle: Overlay` or `Transparent`, macOS draws the traffic lights
 * itself, at the very top left of the *window* — over the sidebar, not over the
 * content. So on macOS this component reserves space and renders **no** controls
 * of its own. Drawing TEA UI buttons over the OS's would be two sets of window
 * controls, and macOS users would find the wrong ones first.
 *
 * The inset is a prop because its exact value depends on the OS version and the
 * display's zoom factor. The default matches a stock 1080p display; a product on
 * a scaled display should measure it once rather than ship a guess.
 *
 * ### The window API is injected
 *
 * There is no `@tauri-apps/api` import anywhere in this file. The shell needs six
 * operations and cannot know which host provides them, so the host passes them
 * in. That is what lets the same shell run in a Tauri window, in Electron, and
 * in a plain browser build for development — where `window` is a small adapter
 * that does nothing.
 */

/** The platform conventions that differ. Not the browser, not the OS build. */
export type DesktopPlatform = "macos" | "windows" | "linux";

/**
 * The operations a host window has to provide.
 *
 * `minimize`, `toggleMaximize` and `close` are required because the controls
 * cannot work without them. The rest are optional enhancements: a host that
 * cannot report its maximized state still gets a working title bar, it just does
 * not know whether to draw the maximize or the restore glyph.
 */
export interface DesktopWindow {
  minimize(): void;
  toggleMaximize(): void;
  close(): void;
  /**
   * Only needed when the host cannot rely on `data-tauri-drag-region`. Tauri
   * handles the declarative attribute itself, so most hosts never pass this.
   */
  startDragging?(): void;
  isMaximized?(): boolean | Promise<boolean>;
  /** Subscribe to maximize changes. Returns the unsubscribe function. */
  onMaximizeChange?(listener: (maximized: boolean) => void): () => void;
}

export interface DesktopShellProps
  extends Omit<React.ComponentProps<"div">, "onError" | "onSelect"> {
  product: string;
  /** One line under the product name. See `AdminShell`'s `tagline`. */
  tagline?: string | undefined;
  /** Which window conventions to follow. Decides the controls and the inset. */
  platform: DesktopPlatform;
  /** The host window. See {@link DesktopWindow}. */
  window: DesktopWindow;
  nav: readonly NavItemData[];
  activeId: string;
  onNavigate?: ((id: string) => void) | undefined;
  /** Left of the window controls: a live status summary. */
  status?: React.ReactNode | undefined;
  /** Right of the status, left of the window controls. */
  actions?: React.ReactNode | undefined;
  sidebarFooter?: React.ReactNode | undefined;
  mainId?: string | undefined;
  /**
   * Space reserved on the leading edge for macOS traffic lights. Ignored on
   * other platforms, where the controls are drawn instead.
   */
  trafficLightInset?: string | undefined;
  children: React.ReactNode;
}

/**
 * One window control.
 *
 * `data-tauri-drag-region="false"` is load-bearing and not decoration: without it
 * the press starts a window drag and the button never fires, so Close would drag
 * the window instead of closing it — the one failure in this component that
 * loses the user's work without saying anything.
 *
 * `size="sm"` is the smallest the density scale offers — 28px at the default
 * density, which is the WCAG 2.5.5 floor rather than the OS caption button a
 * Windows title bar would draw. TEA UI does not reproduce caption geometry,
 * because those are physical sizes that change with the OS scale factor while
 * this scale is the product's. A product that wants the exact native metrics
 * passes a `className`; the target size stays above the floor either way.
 */
function WindowControl({
  label,
  onClick,
  destructive = false,
  children,
}: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <IconButton
      label={label}
      size="sm"
      variant="ghost"
      onClick={onClick}
      data-tauri-drag-region="false"
      className={cn(
        "rounded-none text-fg-muted hover:bg-surface-3 hover:text-fg",
        // The OS paints the close button red on hover. Matching it is what makes
        // a custom title bar feel native rather than merely similar.
        destructive && "hover:bg-destructive hover:text-destructive-fg",
      )}
    >
      {children}
    </IconButton>
  );
}

export function DesktopShell({
  product,
  tagline,
  platform,
  window: hostWindow,
  nav,
  activeId,
  onNavigate,
  status,
  actions,
  sidebarFooter,
  mainId = "tea-main",
  trafficLightInset = "78px",
  className,
  children,
  ...props
}: DesktopShellProps): React.ReactElement {
  const [maximized, setMaximized] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const read = hostWindow.isMaximized?.();
    if (read !== undefined) {
      void Promise.resolve(read).then((value) => {
        // `isMaximized` is async in Tauri, so this can land after the window has
        // been replaced or the shell unmounted. Without the flag the state update
        // runs against a component that is no longer there.
        if (!cancelled) setMaximized(value);
      });
    }

    const unsubscribe = hostWindow.onMaximizeChange?.((value) => setMaximized(value));
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [hostWindow]);

  const macos = platform === "macos";

  return (
    <Box
      className={cn(
        // `h-dvh`, not `min-h-dvh`: a window has no document to grow, so the
        // shell owns exactly the window's height and the scroll lives inside
        // `<main>`. `overflow-hidden` is what makes that true rather than
        // aspirational — without it the sidebar stretches and the whole shell
        // scrolls as one column.
        "flex h-dvh flex-col overflow-hidden bg-canvas text-fg",
        className,
      )}
      {...props}
    >
      <SkipLink targetId={mainId} />

      <header
        aria-label={COPY.window.titlebar}
        data-tauri-drag-region
        /*
         * Double-click to maximize, which is what every window in the OS does
         * and the only pointer gesture a title bar has. It is an *addition* to
         * the buttons below, not a replacement: a keyboard user reaches maximize
         * through the control, and a screen reader user reaches it by name.
         */
        onDoubleClick={() => hostWindow.toggleMaximize()}
        onMouseDown={(event) => {
          /*
           * Only a press on the band itself starts a drag. A press that begins on
           * a button or a link is that control's business, and calling
           * `startDragging` here would move the window while the user is trying
           * to click.
           */
          if (hostWindow.startDragging && event.target === event.currentTarget) {
            hostWindow.startDragging();
          }
        }}
        className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-canvas pe-1 select-none"
        style={{ paddingInlineStart: macos ? trafficLightInset : undefined }}
      >
        <div className="min-w-0 shrink" data-tauri-drag-region>
          <span className="block truncate text-ui font-semibold text-fg">{product}</span>
          {tagline ? (
            <span className="block truncate text-micro text-fg-muted">{tagline}</span>
          ) : null}
        </div>

        {status ? (
          <div className="hidden min-w-0 lg:flex" data-tauri-drag-region="false">
            {status}
          </div>
        ) : null}

        {/*
         * `data-tauri-drag-region="false"` on the interactive group, and
         * `ms-auto` to push the controls to the trailing edge. The group opts out
         * of the drag once, rather than each control opting out individually —
         * a wrapper that forgets is a wrapper that swallows a click.
         */}
        <div
          data-tauri-drag-region="false"
          className="ms-auto flex items-center gap-2"
        >
          {actions ? <HStack gap="ui">{actions}</HStack> : null}
          {/*
           * The separator only between page actions and window controls: it
           * separates two different kinds of thing, and it is the seam where the
           * drag region stops and the window's own controls begin.
           */}
          {macos ? null : (
            <span aria-hidden="true" className="h-5 w-px self-stretch bg-line" />
          )}
        </div>

        {macos ? null : (
          <div data-tauri-drag-region="false" className="flex items-center">
            <WindowControl label={COPY.window.minimize} onClick={() => hostWindow.minimize()}>
              <Minus size={14} aria-hidden="true" />
            </WindowControl>
            <WindowControl
              label={maximized ? COPY.window.restore : COPY.window.maximize}
              onClick={() => hostWindow.toggleMaximize()}
            >
              {/*
               * `Copy` for restore, not a window icon of its own. Windows draws
               * restore as two overlapping rectangles, and among the curated
               * glyphs that is the closest honest match; `Square` would read as
               * "make square" and `Maximize2` twice would read as "maximize".
               */}
              {maximized ? (
                <Copy size={13} aria-hidden="true" />
              ) : (
                <Maximize2 size={13} aria-hidden="true" />
              )}
            </WindowControl>
            <WindowControl
              label={COPY.window.closeWindow}
              destructive
              onClick={() => hostWindow.close()}
            >
              <X size={14} aria-hidden="true" />
            </WindowControl>
          </div>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        {/*
         * No `header` prop, on purpose. The brand moved up into the title bar, so
         * giving the sidebar one would put a second band above the navigation —
         * the double header again, one level down. The `Sidebar`'s divider line
         * is therefore absent too, which is correct: with the title bar spanning
         * the full width, a line under an empty band would cut the window in two.
         */}
        <Sidebar
          label={COPY.navigation.main}
          items={nav}
          activeId={activeId}
          onNavigate={onNavigate}
          footer={sidebarFooter}
        />

        <main
          id={mainId}
          tabIndex={-1}
          className="min-w-0 flex-1 overflow-y-auto focus-visible:outline-none"
        >
          {children}
        </main>
      </div>
    </Box>
  );
}

/** Re-exported so a product can type its own `SidebarContent` usage. */
export type { SidebarContentProps };