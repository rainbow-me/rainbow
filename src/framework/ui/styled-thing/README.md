# styled-thing

Custom styling engine for React Native, created as a performance replacement for `styled-components`.

## What

A drop-in replacement for `styled-components` that only supports **object syntax** (no CSS template literals). Provides the same API surface (`styled.View({...})`, `.attrs()`, `.withConfig()`) but skips all the work React Native doesn't need: CSS string parsing, class name hashing, and style caching via hash keys.

Also includes `hoist.ts`, adapted from `hoist-non-react-statics` to avoid a `react-is` dependency.

The `css` export is a pass-through re-export from the `styled-components` package.

## Why

`styled-components` transforms style objects into CSS string representations, generates class name hashes for caching, and then parses them back into objects for React Native. This implementation skips all of that, operating directly on style objects. The result was a significant performance improvement, particularly on Android.

## Origin

- PR [#2730](https://github.com/rainbow-me/rainbow/pull/2730), February 2022
- Authors: Terry Sahaidak, Mark Dalgleish, osdnk, Skylar Barrera, Jin Chung

## Status: Gradually Being Replaced

New code should use `src/design-system/` primitives (`Box`, `Text`, `Stack`, `Inline`, `Rows`, `Columns`, etc.) instead of styled-thing. The design-system provides a token-based component API that handles layout, typography, and theming without a CSS-in-JS abstraction.

When modifying an existing styled-thing consumer, consider migrating it to design-system components as part of the change.
