/* eslint-disable sort-keys-fix/sort-keys-fix */
import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { ColorModeProvider } from '../../color/ColorMode';
import { basePalette } from '../../color/palette';
import { Docs } from '../../playground/Docs';
import { Guide } from '../../playground/Guide';
import { Stack } from '../Stack/Stack';
import { Heading, HeadingProps } from './Heading';

const headingExamples: Required<Pick<HeadingProps, 'size' | 'weight'>>[] = [
  { size: 'title', weight: 'heavy' },
  { size: 'title', weight: 'bold' },
  { size: 'heading', weight: 'heavy' },
  { size: 'heading', weight: 'bold' },
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

const titleCase = (string: string) =>
  `${string[0].toUpperCase()}${string.slice(1)}`;

const loremIpsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const docs: Docs = {
  name: 'Heading',
  category: 'Content',
  examples: headingExamples.map(({ size, weight }) => ({
    name: `${titleCase(size)} (${weight})`,
    example: (
      <>
        <Stack space="12dp">
          <Stack separator={<Guide />}>
            <Heading size={size} weight={weight}>
              {loremIpsum}
            </Heading>
            <Heading numberOfLines={1} size={size} weight={weight}>
              Truncated text truncated text truncated text truncated text
              truncated text truncated text
            </Heading>
            <Heading containsEmoji size={size} weight={weight}>
              With emoji 🌈
            </Heading>
            <View
              style={{ backgroundColor: basePalette.greyDark, padding: 20 }}
            >
              <ColorModeProvider value="dark">
                <Heading size={size} weight={weight}>
                  Dark mode
                </Heading>
              </ColorModeProvider>
            </View>
            <View
              style={{ backgroundColor: basePalette.greyDark, padding: 20 }}
            >
              <ColorModeProvider value="darkTinted">
                <Heading size={size} weight={weight}>
                  Dark tinted mode
                </Heading>
              </ColorModeProvider>
            </View>
          </Stack>
          <MockBadge>
            <Heading size={size} weight={weight}>
              CENTERED TEXT
            </Heading>
          </MockBadge>
          <MockBadge>
            <Heading size={size} weight={weight}>
              Centered text
            </Heading>
          </MockBadge>
        </Stack>
      </>
    ),
  })),
};

export default docs;
