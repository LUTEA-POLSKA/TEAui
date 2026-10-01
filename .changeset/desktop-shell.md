---
"@tea-ui/admin": minor
"@tea-ui/ux-standards": minor
---

DesktopShell: the application shell for a product that is a window

A Tauri app with `decorations: false` has no title bar of its own, which means
the shell has to *be* the title bar. `AdminShell` is not that and cannot become
it by prop: it is built for a browser tab, where the brand sits in a band above
the navigation and the top band holds only the page's controls. In a window that
is two stacked headers where the user expects one.

So `DesktopShell` is its own structure rather than a variant:

- **One band carries the brand, the page actions and the window controls.** The
  sidebar gets no `header` prop at all, so there is no second band — and no empty
  band with a divider cutting the window in two.
- **The band is the drag region.** `data-tauri-drag-region` on the header, and
  `data-tauri-drag-region="false"` on the actions group and on every control.
  That second attribute is load-bearing rather than decorative: a press inside a
  drag region moves the window, so Close would drag the window instead of closing
  it — the one failure in this component that loses work without saying anything.
  Double-click toggles maximize, which every title bar does, and is an addition
  to the buttons rather than a replacement: a keyboard user reaches maximize
  through the control.
- **The window does not scroll.** `h-dvh` with the scroll inside `<main>`, not
  `min-h-dvh` and a scrolling document. A window has no document to grow.

**macOS is not a styling variant.** With `titleBarStyle: Overlay` or `Transparent`
the OS draws the traffic lights itself, at the top left of the *window* — over the
sidebar. So on macOS the shell reserves the leading edge and renders no controls;
drawing TEA UI buttons over the OS's would be two sets of window controls, which
is the defect and not the fix. The inset is a prop, because its real value
depends on the OS version and the display scale factor and a product should
measure it once instead of inheriting a guess.

**The window API is injected.** No `@tauri-apps/api` import anywhere in
`@tea-ui/admin`. The shell needs six operations and cannot know which host
provides them, so the host passes them in — which is what lets one source run in a
Tauri window, in Electron, and in a browser tab during development where the
adapter is three no-ops. `minimize`, `toggleMaximize` and `close` are required;
`isMaximized` and `onMaximizeChange` are optional, and the control simply does not
know which glyph to draw when a host cannot say.

`COPY.window` adds the four control labels. The close button is `closeWindow`, not
`actions.close`: "Close" on a title bar tells a screen reader user the dialog is
dismissing, and the dialog is not.

The Showcase gets a Desktop section with a platform switch and a window whose
operations write to a line of text, because a demo whose buttons do nothing
demonstrates nothing.

Gate: 329 tests (21 new), boundaries, encoding, types, lint, both builds, the
export contract, tree-shaking and both app builds green.