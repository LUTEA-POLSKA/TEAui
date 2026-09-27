# @tea-ui/tokens

Design tokens: colour, spacing, radii, motion, density, and the themes.

Part of [TEA UI](https://landnevermore.github.io/TEAui/) — a design system built once and reused across
products. The whole system is documented at https://landnevermore.github.io/TEAui/docs/.

## Install

```bash
npm install @tea-ui/tokens
```

React 18.2 or 19 is expected as a peer dependency.

## Use

```ts
import { tokens } from "@tea-ui/tokens";
```

## Styles

The token layer ships its stylesheet as a separate export, so it is only
downloaded when it is asked for:

```ts
import "@tea-ui/tokens/styles.css";
```

## Licence

MIT. See [LICENSE](./LICENSE).
