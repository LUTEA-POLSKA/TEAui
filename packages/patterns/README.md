# @tea-ui/patterns

Composable arrangements that solve recurring interaction problems.

Ships `FilterBar` and `ActionBar`. The remaining patterns are declared in
`PATTERNS` with the interaction contract each one is held to — a registry entry
is a promise, so it ships with a boundary rather than on its own.

Part of [TEA UI](https://landnevermore.github.io/TEAui/) — a design system built once and reused across
products. The whole system is documented at https://landnevermore.github.io/TEAui/docs/.

## Install

```bash
npm install @tea-ui/patterns
```

React 18.2 or 19 is expected as a peer dependency.

## Use

```ts
import { Button } from "@tea-ui/patterns";
```

## Styles

The token layer ships its stylesheet as a separate export, so it is only
downloaded when it is asked for:

```ts
import "@tea-ui/patterns/styles.css";
```

## Licence

MIT. See [LICENSE](./LICENSE).
