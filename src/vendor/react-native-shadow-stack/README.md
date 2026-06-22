# react-native-shadow-stack

Fork of [`rainbow-me/react-native-shadow-stack`](https://github.com/rainbow-me/react-native-shadow-stack)
at v0.0.5 (last upstream commit April 2020), inlined and adapted for cross-platform use.

## What it does

Wraps children with multiple overlapping shadows to fake iOS-style layered drop shadows. `ShadowStack` renders one
absolutely-positioned `ShadowItem` per shadow tuple under the content. On Android, where per-view shadow stacking isn't
supported, it falls back to native `elevation` via `ShadowView`.

Public API:

- `ShadowStack` - the container component.
- `ShadowView` - the platform-aware view used by a few callers directly.

## Why forked

Upstream is an abandoned throwaway library and is **iOS-only** - it has no Android support and never will. It cannot be
re-adopted as an npm dependency. The app no longer depends on the published package; this in-tree copy is the source of truth.

## Modifications vs upstream

Inlined and ported to Android in [#1129](https://github.com/rainbow-me/rainbow/pull/1129) (2020-11-11):

- Added `ShadowView` - maps `shadowRadius` to Android `elevation`; passes through on iOS.
- `Platform.OS` branching in `ShadowStack` (shadow items render on iOS only; Android uses summed `elevation`).
- Extra style passthrough on `ShadowItem` (`borderRadius`, `height`, `width`, `opacity`, `zIndex`, `overflow`,
  background fill) and null-safety on `shadows`.
- Removed `prop-types` / `defaultProps`.

## Status

Frozen legacy on a deprecation path. The intended replacement is design-system shadows (`Box` / `ApplyShadow`) and,
longer term, native `boxShadow` (see Linear RNBW-2189 and APP-3457). Do not invest here - migrate consumers to the
design system rather than extending this fork.
