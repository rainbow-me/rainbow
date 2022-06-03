/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { View } from 'react-native';
import { ColorModeProvider } from '../../color/ColorMode';
import { palettes } from '../../color/palettes';
import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Guide } from '../../playground/Guide';
import { MockBadge } from '../../playground/MockBadge';
import { Inline } from '../Inline/Inline';
import { Stack } from '../Stack/Stack';
import { Heading, HeadingProps } from './Heading';

const headingExamples: Required<Pick<HeadingProps, 'size' | 'weight'>>[] = [
  { size: '34px', weight: 'bold' },
  { size: '30px', weight: 'bold' },
  { size: '28px', weight: 'bold' },
  { size: '23px', weight: 'bold' },
  { size: '20px', weight: 'bold' },
  { size: '18px', weight: 'bold' },
];

const loremIpsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

export const sizes: Example[] = headingExamples.map(({ size, weight }) => ({
  name: `${size} (${weight})`,
  Example: () =>
    source(
      <>
        <Stack space="10px">
          <View>
            <Guide />
            <Heading size={size} weight={weight}>
              {loremIpsum}
            </Heading>
            <Guide />
            <Heading numberOfLines={1} size={size} weight={weight}>
              Truncated text truncated text truncated text truncated text
              truncated text truncated text
            </Heading>
            <Guide />
          </View>
          <Inline space="10px">
            <MockBadge>
              <Heading size={size} weight={weight}>
                CENTERED
              </Heading>
            </MockBadge>
            <MockBadge>
              <Heading size={size} weight={weight}>
                Centered
              </Heading>
            </MockBadge>
          </Inline>
        </Stack>
      </>
    ),
}));

export const withEmoji: Example = {
  name: 'With emoji',
  Example: () =>
    source(
      <View>
        <Guide />
        <Heading containsEmoji>Heading with emoji 🌈</Heading>
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
        <Heading numberOfLines={1}>
          Truncated text truncated text truncated text truncated text truncated
          text truncated text
        </Heading>
        <Guide />
      </View>
    ),
};

export const withColor: Example = {
  name: 'With color',
  Example: () =>
    source(
      <View>
        <View
          style={{
            backgroundColor: palettes.dark.backgroundColors.body.color,
            padding: 24,
          }}
        >
          <Stack space="24px">
            <ColorModeProvider value="dark">
              <Heading>Dark mode</Heading>
            </ColorModeProvider>
            <ColorModeProvider value="darkTinted">
              <Heading>Dark tinted mode</Heading>
            </ColorModeProvider>
          </Stack>
        </View>
      </View>
    ),
};
