/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { View } from 'react-native';
import { AccentColorProvider } from '../../color/AccentColorContext';
import { ColorModeProvider } from '../../color/ColorMode';
import { palettes } from '../../color/palettes';
import { CustomColor } from '../../color/useForegroundColor';
import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Guide } from '../../playground/Guide';
import { MockBadge } from '../../playground/MockBadge';
import { fontWeights } from '../../typography/fontWeights';
import { Inline } from '../Inline/Inline';
import { Stack } from '../Stack/Stack';
import { Text, TextProps } from './Text';

const textExamples: Required<Pick<TextProps, 'size' | 'weight'>>[] = [
  { size: '23px', weight: 'bold' },
  { size: '18px', weight: 'bold' },
  { size: '16px', weight: 'bold' },
  { size: '15px', weight: 'bold' },
  { size: '14px', weight: 'bold' },
  { size: '12px', weight: 'bold' },
  { size: '11px', weight: 'bold' },
];

const loremIpsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const customTextColor: CustomColor = {
  custom: {
    dark: 'salmon',
    darkTinted: 'pink',
    light: 'red',
  },
};

export const sizes: Example[] = textExamples.map(({ size, weight }) => ({
  name: `${size} (${weight})`,
  Example: () =>
    source(
      <Stack space="10px">
        <View>
          <Guide />
          <Text size={size} weight={weight}>
            {loremIpsum}
          </Text>
          <Guide />
        </View>
        <Inline space="10px">
          <MockBadge>
            <Text size={size} weight={weight}>
              CENTERED
            </Text>
          </MockBadge>
          <MockBadge>
            <Text size={size} weight={weight}>
              Centered
            </Text>
          </MockBadge>
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
        <Text containsEmoji>Text with emoji 🌈</Text>
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
        <Text size="16px" weight="bold">
          Truncated text truncated text truncated text truncated text truncated
          text truncated text Truncated text truncated text truncated text
          truncated text truncated text truncated text
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
          <Text key={value} weight={name as keyof typeof fontWeights}>
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
        <Text color="secondary50">Default mode</Text>
        <Text color="action">Action color</Text>
        <Text color="accent">Default accent color</Text>
        <AccentColorProvider color="orange">
          <Text color="accent">Custom accent color</Text>
        </AccentColorProvider>
        <Text color={customTextColor}>Custom color</Text>
        <View>
          <View
            style={{
              backgroundColor: palettes.dark.backgroundColors.body.color,
              padding: 24,
            }}
          >
            <Stack space="24px">
              <ColorModeProvider value="dark">
                <Stack space="12px">
                  <Text color="secondary50">Dark mode</Text>
                  <Text color={customTextColor}>Custom color</Text>
                </Stack>
              </ColorModeProvider>

              <ColorModeProvider value="darkTinted">
                <Stack space="12px">
                  <Text color="secondary50">Dark tinted mode</Text>
                  <Text color={customTextColor}>Custom color</Text>
                </Stack>
              </ColorModeProvider>
            </Stack>
          </View>
        </View>
      </Stack>
    ),
};
