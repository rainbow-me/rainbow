/* eslint-disable sort-keys-fix/sort-keys-fix */
import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { ColorModeProvider } from '../../color/ColorMode';
import { palettes } from '../../color/palettes';
import { Docs } from '../../playground/Docs';
import { Guide } from '../../playground/Guide';
import { Inline } from '../Inline/Inline';
import { Stack } from '../Stack/Stack';
import { Heading, HeadingProps } from './Heading';

const headingExamples: Required<Pick<HeadingProps, 'size' | 'weight'>>[] = [
  { size: '23px', weight: 'bold' },
  { size: '20px', weight: 'bold' },
  { size: '18px', weight: 'bold' },
];

const MockBadge = ({ children }: { children: ReactNode }) => (
  <View style={{ display: 'flex', flexDirection: 'row' }}>
    <View
      style={{
        backgroundColor: 'rgba(255,0,0,0.2)',
        borderRadius: 999,
        display: 'flex',
        justifyContent: 'center',
        paddingHorizontal: 18,
        paddingVertical: 6,
      }}
    >
      {children}
    </View>
  </View>
);

const loremIpsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const docs: Docs = {
  name: 'Heading',
  category: 'Content',
  examples: [
    ...headingExamples.map(({ size, weight }) => ({
      name: `${size} (${weight})`,
      example: (
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
    })),
    {
      name: 'With emoji',
      example: (
        <>
          <Guide />
          <Heading containsEmoji>Heading with emoji 🌈</Heading>
          <Guide />
        </>
      ),
    },
    {
      name: 'With truncation',
      example: (
        <>
          <Guide />
          <Heading numberOfLines={1}>
            Truncated text truncated text truncated text truncated text
            truncated text truncated text
          </Heading>
          <Guide />
        </>
      ),
    },
    {
      name: 'With color',
      example: (
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
    },
  ],
};

export default docs;
