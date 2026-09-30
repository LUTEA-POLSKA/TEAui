---
"@tea-ui/core": patch
"@tea-ui/ux-standards": minor
---

Remove a dead live region from the toast surface, name the dismiss-all control for what it does, and stop the module comment claiming a feature that does not exist.

**The toast surface rendered a live region that could never announce anything.** `<span className="sr-only" aria-live="polite" data-toast-count={0} />` was fed by a local `const overflow = 0`, so the region never changed and never announced. A live region is a promise made to a screen-reader user; one that is added on every mount and stays silent is worse than none, because it is indistinguishable from a region that is working. Radix's `Toast.Root` registers with the provider and keeps its own `aria-live` region — confirmed in the rendered DOM, which carries `<span aria-live="assertive" role="status">Notification …</span>` appended outside the React tree — so this surface now renders no region of its own.

**The dismiss-all control read "Reset".** Nothing on a toast is a form, and nothing about closing three notifications puts anything back the way it was; the verb promised a different action than the one it performed. `COPY.actions.dismissAll` is new, which is a minor on `@tea-ui/ux-standards`.

**The module comment documented an overflow counter that was never built.** It claimed the limit was three "counted and shown rather than swallowed", and that a user who triggered four operations "is told that three are running and one is queued". The code does `slice(-TOAST_LIMIT)` and has no counter, no queue and no notice. The comment is now what the code does: three at once, oldest dropped, drop silent, and the reason that silence is the honest one — a surface that claims to report a queue has to report one.

**The audit of this file was wrong twice, and the tests are what caught it.** The first pass asserted from the JSX that toasts rendered as siblings of the viewport, which would have put every toast in normal document flow while the `fixed end-0 top-0` classes sat on an empty element. They do not: `ToastPrimitive.Root` is rendered *through* the viewport, so the sibling relationship in the source says nothing about the DOM. The second pass reported that `dismiss(id)` left its timer armed, on the strength of a test that compared `toast.dismiss` to `toast.dismiss` and therefore could not fail. `dismiss` has called `clearTimer(id)` all along. Both claims are recorded in the test file as the reason those tests assert the rendered DOM and a subscriber's render count rather than the shape of the source.

The suite also needed a test-environment fix rather than a product fix. The viewport is swipe-dismissible, so a click anywhere inside a toast reaches a handler that calls `hasPointerCapture`, which jsdom does not implement; the resulting `TypeError` surfaced as an unhandled error that failed runs whose assertions all passed. `vitest.setup.ts` now stubs the pointer-capture trio, with `hasPointerCapture` answering `false` because capture is never actually held under jsdom.

**Known sharp edge, still documented rather than fixed:** the store is module-level, so a second `Toaster` renders every toast a second time *and* has the primitive announce it a second time. The source says mount this once; `toast.test.tsx` now pins that behaviour so the advice cannot rot silently, and a follow-up should make a second `Toaster` render nothing instead.
