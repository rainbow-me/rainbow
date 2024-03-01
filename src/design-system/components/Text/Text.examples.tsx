import React from 'react';
import { View } from 'react-native';
import { AccentColorProvider } from '../../color/AccentColorContext';
import { ColorModeProvider } from '../../color/ColorMode';
import { palettes } from '../../color/palettes';
import { CustomColor } from '../../color/useForegroundColor';
import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Guide } from '../../playground/Guide';
import { fontWeights } from '../../typography/fontWeights';
import { TextSize, typeHierarchy } from '../../typography/typeHierarchy';
import { Inline } from '../Inline/Inline';
import { Stack } from '../Stack/Stack';
import { Text } from './Text';

const loremIpsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const customTextColor: CustomColor = {
  custom: {
    dark: 'salmon',
    darkTinted: 'pink',
    light: 'red',
  },
};

export const sizes: Example[] = (Object.keys(typeHierarchy.text) as TextSize[])
  .sort((a: TextSize, b: TextSize) => {
    // Move deprecated values to the bottom of the list.
    // This allows us to optimize git diffs for the deprecated values
    // while de-emphasizing them in the design system playground.
    if (a.includes('Deprecated') && !b.includes('Deprecated')) {
      return 1;
    }

    if (b.includes('Deprecated') && !a.includes('Deprecated')) {
      return -1;
    }

    return 0;
  })
  .map(size => ({
    name: size,
    Example: () =>
      source(
        <Stack space="10px">
          <View>
            <Guide />
            <Text color="label" size={size} weight="bold">
              {loremIpsum}
            </Text>
            <Guide />
          </View>
          <Inline alignVertical="center" space="10px">
            <View style={{ backgroundColor: 'rgba(255,0,0,0.2)' }}>
              <Text color="label" size={size} weight="bold">
                Bounding Box
              </Text>
            </View>
            <View style={{ position: 'relative' }}>
              <Text color="label" size={size} weight="bold">
                Bounding Box
              </Text>
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgb(255, 212, 211)',
                  zIndex: 1,
                }}
              />
            </View>
          </Inline>
        </Stack>
      ),
  }));

export const withEmoji: Example = {
  name: 'With emoji',
  Example: () =>
    source(
      <View>
        <Guide />
        <Text color="label" containsEmoji size="17pt">
          Text with emoji 🌈
        </Text>
        <Guide />
      </View>
    ),
};

export const withTruncation: Example = {
  name: 'With truncation',
  Example: () =>
    source(
      <View>
        <Guide />
        <Text color="label" size="17pt" weight="bold">
          Truncated text truncated text truncated text truncated text truncated text truncated text Truncated text truncated text truncated
          text truncated text truncated text truncated text
        </Text>
        <Guide />
      </View>
    ),
};

export const withWeight: Example = {
  name: 'With weight',
  Example: () =>
    source(
      <Stack space="10px">
        {Object.entries(fontWeights).map(([name, value]) => (
          <Text key={value} color="label" size="17pt" weight={name as keyof typeof fontWeights}>
            {name} ({value})
          </Text>
        ))}
      </Stack>
    ),
};

export const withColor: Example = {
  name: 'With color',
  Example: () =>
    source(
      <Stack space="12px">
        <Text color="label" size="17pt">
          Default mode
        </Text>
        <Text color="action (Deprecated)" size="17pt">
          Action color
        </Text>
        <Text color="accent" size="17pt">
          Default accent color
        </Text>
        <AccentColorProvider color="orange">
          <Text color="accent" size="17pt">
            Custom accent color
          </Text>
        </AccentColorProvider>
        <Text color={customTextColor} size="17pt">
          Custom color
        </Text>
        <View>
          <View
            style={{
              backgroundColor: palettes.dark.backgroundColors['surfacePrimary'].color,
              padding: 24,
            }}
          >
            <Stack space="24px">
              <ColorModeProvider value="dark">
                <Stack space="12px">
                  <Text color="label" size="17pt">
                    Dark mode
                  </Text>
                  <Text color={customTextColor} size="17pt">
                    Custom color
                  </Text>
                </Stack>
              </ColorModeProvider>

              <ColorModeProvider value="darkTinted">
                <Stack space="12px">
                  <Text color="label" size="17pt">
                    Dark tinted mode
                  </Text>
                  <Text color={customTextColor} size="17pt">
                    Custom color
                  </Text>
                </Stack>
              </ColorModeProvider>
            </Stack>
          </View>
        </View>
      </Stack>
    ),
};
