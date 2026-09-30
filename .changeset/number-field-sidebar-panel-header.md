---
"@tea-ui/core": minor
---

Add `NumberField`, `Sidebar` and `PanelHeader`.

- `NumberField` renders the unit inside the control *and* points `aria-describedby` at it. A bare "512" in a speed field is not an answer; "512 MB/s" is. The unit stays visible and screen-reader reachable without wrapping the control in a second landmark.
- `Sidebar` takes the collapse breakpoint as a product decision, not a token default, and resolves it through a static class lookup so Tailwind can still extract every variant. `SidebarContent` is the same navigation for the mobile drawer, which is what removes the second hand-maintained copy of the nav.
- `PanelHeader` requires its heading `level` and always renders a real heading element at that level, so a page header cannot silently become a styled `div`.
