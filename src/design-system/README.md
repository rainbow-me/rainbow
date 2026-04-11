# Rainbow Design System

The design system provides the foundational UI primitives used throughout the Rainbow app. All components are exported from `src/design-system/index.ts`.

## Color

Color is modeled based on _why_ something should be a certain color, defined with semantic names that allow them to adjust based on context. This makes it trivial to re-use components in different environments without having to manually adjust foreground colors.

When setting a background with `Box`, the color mode is automatically configured for nested elements based on whether the background is dark or light, meaning that foreground colors usually won't need to be changed.

## Typography

Native text nodes contain additional space above capital letters and below the baseline. This is completely different to how designers think about typography and ends up creating extra work during development to fix unbalanced spacing.

To correct for this, we use [Capsize](https://seek-oss.github.io/capsize) (with a thin wrapper adapting it to React Native) which applies negative margins above and below text nodes, ensuring that their space in the layout is aligned with the actual glyphs on screen.

Capsize in React Native gets us close, but we still see some minor vertical alignment issues, so we also apply magic-number corrections for each font size in `typeHierarchy.ts` -- usually a decimal between 1 and -1.

## Layout

The role of layout components is to apply space within containers and between sibling elements. For this model to work, individual components should **not** have any surrounding space. If components have margins built into them, it becomes difficult to compose them into a layout because space will be unbalanced by default.

All layout components accept spacing values from the standard space scale (e.g. `space="20px"`) to reduce variation in layouts. If you need a value outside the scale, use `space={{ custom: 17 }}`.
