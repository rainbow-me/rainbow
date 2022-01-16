# 🎨📦🌈 Rainbow Design System 🌈📦🎨

> 💡 To view the design system cheat sheet while working on the app, run `yarn ds` and open http://localhost:3000.

The goal of Rainbow Design System is to make it fast and easy to build and maintain standard Rainbow designs.

As much as possible, component APIs at the screen level should be high level, reading the way a designer would describe them. You ideally shouldn't have to write a bunch of low-level styling or manually adjust padding and margins on individual components to create visual balance. To achieve this, we need to start at the foundations and build up in layers.

> This document is not currently intended to be exhaustive, instead providing an overview of the core parts of the system.
>
> This is still a work in progress. APIs are incomplete and likely to change. It's recommended that all code importing from `@rainbow-me/design-system` is written in TypeScript so that API changes are picked up.

### Typography

A major problem when trying to build a component system is that [native text nodes contain additional space above capital letters and below the baseline.](https://medium.com/microsoft-design/leading-trim-the-future-of-digital-typesetting-d082d84b202) This is completely different to how designers think about typography and ends up creating a lot of extra work during development to fix unbalanced spacing.

To correct for this, we use a library called [Capsize](https://seek-oss.github.io/capsize) (with a thin wrapper adapting it to React Native) which applies negative margins above and below text nodes, ensuring that their space in the layout is aligned with the actual glyphs on screen.

> Using Capsize in React Native gets us _really_ close, but unfortunately we still see some minor vertical alignment issues, so we're also applying some magic-number corrections for each font size — usually a decimal between 1 and -1. If you have any insight into why we need to do this, please let us know 🙏

Text is handled by the `Text` and `Heading` components. Both of these components optionally support `size`, `weight` and `align` props, while `Text` also has props for `color`, `uppercase` and `tabularNumbers`.

```tsx
import { Heading } from '@rainbow-me/design-system';

export default () => <Heading>Lorem ipsum</Heading>;
```

```tsx
import { Text } from '@rainbow-me/design-system';

export default () => (
  <Text color="secondary50" weight="bold">
    Lorem ipsum
  </Text>
);
```

If you need a custom text color, it can be provided in the following format.

```tsx
import { Text } from '@rainbow-me/design-system';

export default () => (
  <Text color={{ custom: '#ff0000' }} weight="bold">
    Lorem ipsum
  </Text>
);
```

Contextual text colors are also supported in a declarative format.

```tsx
import { Text } from '@rainbow-me/design-system';

export default () => (
  <Text
    color={{
      custom: {
        light: '#777',
        dark: '#eee',
      },
    }}
    weight="bold"
  >
    Lorem ipsum
  </Text>
);
```

When text contains emoji, it unfortunately causes vertical alignment issues on iOS. To fix this, you can pass the `containsEmoji` boolean prop if the child node is a single string.

```tsx
import { Text } from '@rainbow-me/design-system';

export default () => <Text containsEmoji>🌈🌈 Lorem ipsum 🌈🌈</Text>;
```

If you're doing anything more complicated with text rendering (e.g. conditional rendering of multiple strings, nested components) you can also use the `renderStringWithEmoji` function directly to operate on a single string at a time.

```tsx
import { Text, renderStringWithEmoji } from '@rainbow-me/design-system';

export default () => (
  <Text>{renderStringWithEmoji('🌈🌈 Lorem ipsum 🌈🌈')}</Text>
);
```

Once we've removed surrounding space from text elements, we can move up to layout.

### Layout

In a component system, the role of layout components is to apply space within containers and between sibling elements. For this model to work, individual components should **not** have any surrounding space. If components have margins built into them, it becomes difficult to compose them into a layout because space will be unbalanced by default.

To better understand layout, let's step through the available layout components and show how they can be composed together.

> Note that all layout components accept spacing values from our standard space scale (e.g. `space="19px"`) which helps reduce the amount of variation in our layouts. These are modeled as strings to make autocompletion easier and to allow for other naming conventions in the future. If you need to use a value that doesn't exist in the scale, it can be provided in the following format: `space={{ custom: 17 }}`.

#### Inset

Renders a **container with padding.**

```tsx
import { Inset } from '@rainbow-me/design-system';

export default () => <Inset space="19px">...</Inset>;
```

Space can also be customized per axis.

```tsx
import { Inset } from '@rainbow-me/design-system';

export default () => (
  <Inset horizontal="19px" vertical="24px">
    ...
  </Inset>
);
```

#### Stack

Arranges children **vertically** with equal spacing between them, plus an optional `separator` element. Items can be aligned with `alignHorizontal`.

If there is only a single child node, no space or separators will be rendered.

```tsx
import { Stack, Inset, Heading, Text } from '@rainbow-me/design-system';

export default () => (
  <Inset horizontal="19px" vertical="24px">
    <Stack space="12px">
      <Heading>...</Heading>
      <Text>...</Text>
    </Stack>
  </Inset>
);
```

Stacks can be nested within each other for layouts with differing amounts of space between groups of content.

```tsx
import { Inset, Stack } from '@rainbow-me/design-system';

export default () => (
  <Inset horizontal="19px" vertical="24px">
    <Stack space="24px">
      <Stack space="19px">
        <Heading>...</Heading>
        <Text>...</Text>
      </Stack>

      <Stack space="19px">
        <Heading>...</Heading>
        <Text>...</Text>
      </Stack>

      <Stack space="19px">
        <Heading>...</Heading>
        <Text>...</Text>
      </Stack>
    </Stack>
  </Inset>
);
```

#### Columns

Renders children **horizontally** in equal-width columns by default, with consistent spacing between them.

If there is only a single column, no space will be rendered.

```tsx
import { Columns, Inset, Stack } from '@rainbow-me/design-system';
import { Button } from './Button';

export default () => (
  <Inset horizontal="19px" vertical="24px">
    <Columns space="12px">
      <Button>...</Button>
      <Button>...</Button>
    </Columns>
  </Inset>
);
```

You can optionally control column widths by manually rendering a `Column` as a direct child of `Columns`, which allows you to set an explicit `width` prop.

A common usage of this is to make a column shrink to the width of its content. This can be achieved by setting the column `width` prop to `"content"`. Any columns without an explicit width will share the remaining space equally.

```tsx
import { Columns, Column, Text } from '@rainbow-me/design-system';

export default () => (
  <Inset horizontal="19px" vertical="24px">
    <Columns space="12px">
      <Text>A long piece of text that can wrap onto multiple lines.</Text>
      <Column width="content">
        <Text>Short text</Text>
      </Column>
    </Columns>
  </Inset>
);
```

The following fractional widths are also available: `"1/2"`, `"1/3"`, `"2/3"`, `"1/4"`, `"3/4"`, `"1/5"`, `"2/5"`, `"3/5"`, `"4/5"`.

Columns can optionally be aligned horizontally and/or vertically, but note that this only affects the column containers themselves, not the content within them. To align content within a column, you'll need to nest another layout component inside it, such as a [`Stack`](#stack) with `alignHorizontal`.

```tsx
import { Columns, Stack } from '@rainbow-me/design-system';

export default () => (
  <Columns space="12px">
    <Stack alignHorizontal="center">...</Stack>
  </Columns>
);
```

#### Inline

Arranges child nodes **horizontally, wrapping to multiple lines if needed,** with equal spacing between items.

If there is only a single child node, no space will be rendered.

```tsx
import { Inline } from '@rainbow-me/design-system';
import { View } from 'react-native';

export default () => (
  <Inline space="12px">
    <View>...</View>
    <View>...</View>
    <View>...</View>
  </Inline>
);
```

Space can also be customized per axis.

```tsx
import { Inline } from '@rainbow-me/design-system';
import { View } from 'react-native';

export default () => (
  <Inline horizontalSpace="19px" verticalSpace="12px">
    <View>...</View>
    <View>...</View>
    <View>...</View>
  </Inline>
);
```

#### Row

Arranges child nodes **horizontally without wrapping,** with equal spacing between them, plus an optional `separator` element. Items can be aligned with `alignHorizontal` and `alignVertical`.

If there is only a single child node, no space or separators will be rendered.

```tsx
import { Row } from '@rainbow-me/design-system';
import { View } from 'react-native';

export default () => (
  <Row space="3px" alignVertical="center">
    <View>...</View>
    <View>...</View>
    <View>...</View>
  </Row>
);
```

#### Bleed

Renders a **container with negative margins,** allowing content to ["bleed"](<https://en.wikipedia.org/wiki/Bleed_(printing)>) into the surrounding layout. This effectively works as the opposite of [`Inset`](#inset) and is designed to support visually breaking out of a parent container without having to refactor the entire component tree.

A common usage of this pattern is to render a screen-width carousel component nested deep within an [`Inset`](#inset).

```tsx
import { Stack, Inset, Heading, Text } from '@rainbow-me/design-system';
import { Carousel } from './Carousel';

const gutter = '19px' as const;

export default () => (
  <Inset horizontal={gutter} vertical="24px">
    <Stack space="12px">
      <Heading>...</Heading>
      <Bleed horizontal={gutter}>
        <Carousel />
      </Bleed>
      <Text>...</Text>
    </Stack>
  </Inset>
);
```

#### DebugLayout

Renders a bright red container around a child element to help debug its position within a layout during development.

```tsx
import { DebugLayout, Stack } from '@rainbow-me/design-system';

export default () => (
  <Stack space="30px">
    ...
    <DebugLayout>...</DebugLayout>
    ...
  </Stack>
);
```

#### Box

Renders an individual `View` element with quick access to the standard padding and negative margin scales, as well as other common layout properties. Ideally you're not supposed to need this component much unless you're building a design system component.

```tsx
import { Box } from '@rainbow-me/design-system';

export default () => (
  <Box marginTop="-19px" marginLeft="-19px" flexDirection="row" flexWrap="wrap">
    <Box paddingTop="19px" paddingLeft="19px">
      ...
    </Box>
  </Box>
);
```

If you need to render something other than a `View`, you can pass a component to the `as` prop.

```tsx
import { Box } from '@rainbow-me/design-system';
import Animated, { useAnimatedStyles } from 'react-native-reanimated';

export default () => {
  const animatedStyles = useAnimatedStyles(/* ... */);

  return (
    <Box
      as={Animated.View}
      style={animatedStyles}
      padding="19px"
      flexDirection="row"
      flexWrap="wrap"
    >
      ...
    </Box>
  );
};
```

`Box` also supports setting a background color via the `background` prop, which leads us into color management.

## Color

Color is modeled based on _why_ something should be a certain color, defined with semantic names that allow them to adjust based on context. This makes it trivial to re-use components in different environments without having to manually adjust foreground colors.

For example, let's assume we have the following piece of text.

```tsx
import { Text } from '@rainbow-me/design-system';

export default () => <Text color="secondary50">Lorem ipsum</Text>;
```

By default, this text will either be dark or light based on whether the app is in light mode or dark mode.

Now, imagine that this text was nested inside of a dark container across both light and dark modes.

```tsx
import { Box, Text } from '@rainbow-me/design-system';

export default () => (
  <Box background="swap" padding="19px">
    <Text color="secondary50">Lorem ipsum</Text>
  </Box>
);
```

Typically in this scenario we'd need to alter the text color so that it has sufficient contrast against the background. However, when setting a background with `Box`, the color mode is automatically configured for nested elements based on whether the background is dark or light, meaning that foreground colors usually won't need to be changed.

#### BackgroundProvider

When not using `Box` (e.g. rendering a `View` or a third-party component), low-level access to the background color palette is available via the `BackgroundProvider` component.

```tsx
import { BackgroundProvider } from '@rainbow-me/design-system';
import { SomeComponent } from 'some-component';

export default () => (
  <BackgroundProvider color="accent">
    {backgroundStyle => (
      <SomeComponent style={backgroundStyle}>...</SomeComponent>
    )}
  </BackgroundProvider>
);
```

You can also pass a `style` object to `BackgroundProvider` so that additional styles are memoized alongside the background color styles.

```tsx
import { BackgroundProvider } from '@rainbow-me/design-system';
import { SomeComponent } from 'some-component';

const customStyles = {
  /* ... */
} as const;

export default () => (
  <BackgroundProvider color="accent" style={customStyles}>
    {backgroundStyle => (
      <SomeComponent style={backgroundStyle}>...</SomeComponent>
    )}
  </BackgroundProvider>
);
```

#### ColorModeProvider

If you're rendering a custom background color, you can take control of the color mode by manually rendering a `ColorModeProvider`.

Beyond the usual `light` and `dark` modes, there are also `lightTinted` and `darkTinted` modes which are designed for non-neutral background colors where foreground colors should be desaturated.

```tsx
import { ColorModeProvider, Box, Text } from '@rainbow-me/design-system';
import { ComponentWithDarkBackground } from './ComponentWithDarkBackground';

export default () => (
  <Box style={{ backgroundColor: '#888' }}>
    <ColorModeProvider value="dark">
      <Text>...</Text>
    </ColorModeProvider>
  </Box>
);
```

#### AccentColorProvider

The `"accent"` color can be configured for entire subtrees of the app. By default, it will resolve to a pale blue color.

```tsx
import { AccentColorProvider, Box, Text } from '@rainbow-me/design-system';

export default () => (
  <AccentColorProvider accent="#ff0000">
    <Text color="accent">...</Text>
  </AccentColorProvider>
);
```

`AccentColorProvider` also detects whether the specified accent color is light or dark and sets the appropriate color mode for you.

```tsx
import { AccentColorProvider, Box, Text } from '@rainbow-me/design-system';

export default () => (
  <AccentColorProvider accent="#ff0000">
    <Box background="accent" padding="19px">
      <Text>This text will be inverted automatically.</Text>
    </Box>
  </AccentColorProvider>
);
```

#### useForegroundColor

Low-level access to the foreground color palette is available via the `useForegroundColor` Hook. This ensures that you get the correct color palette based on the contextual color mode.

```tsx
import { useForegroundColor, Box, Text } from '@rainbow-me/design-system';

export default () => {
  const borderColor = useForegroundColor('accent');

  return (
    <Box padding="6px" style={{ borderWidth: 2, borderColor }}>
      <Text color="accent">...</Text>
    </Box>
  );
};
```

Custom colors can also be passed to this Hook in an object format.

```tsx
import { useForegroundColor, Box, Text } from '@rainbow-me/design-system';

export default () => {
  const borderColor = useForegroundColor({
    custom: {
      light: 'black',
      dark: 'white',
    },
  });

  return (
    <Box padding="6px" style={{ borderWidth: 2, borderColor }}>
      <Text color="accent">...</Text>
    </Box>
  );
};
```

Note that the need for this kind of low-level styling should reduce over time as more patterns are standardized.

## Contribution

To view the design system components in isolation, ensure the following line is in `src/config/debug.js`.

```
export const designSystemPlaygroundEnabled = true;
```

This causes the app to render the design system playground instead of the regular app. The playground code is sourced from `src/design-system/playground/Playground.tsx`. This screen imports files named `*.docs.tsx` from each component folder.

When adding a new component, please ensure that it has a matching docs file and that it's imported in the main `Playground` component.

When adding a new text/heading size, please ensure that you've added an example to the respective `*.docs.tsx` file and validate that the space is being trimmed correctly above capital letters and below the baseline on both iOS and Android.
