/* eslint-disable sort-keys-fix/sort-keys-fix */
import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { ColorModeProvider } from '../../color/ColorMode';
import { palette } from '../../color/palette';
import { Docs } from '../../playground/Docs';
import { Guide } from '../../playground/Guide';
import { Stack } from '../Stack/Stack';
import { Text, TextProps } from './Text';

const textExamples: Required<Pick<TextProps, 'size' | 'weight'>>[] = [
  { size: 'body', weight: 'regular' },
  { size: 'body', weight: 'medium' },
  { size: 'body', weight: 'semibold' },
  { size: 'body', weight: 'bold' },
  { size: 'body', weight: 'heavy' },
  { size: 'small', weight: 'regular' },
  { size: 'small', weight: 'medium' },
  { size: 'small', weight: 'semibold' },
  { size: 'small', weight: 'bold' },
  { size: 'small', weight: 'heavy' },
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

const customTextColor = { darkMode: 'pink', lightMode: 'red' } as const;

const docs: Docs = {
  name: 'Text',
  examples: textExamples.map(({ size, weight }) => ({
    name: `${titleCase(size)} (${weight})`,
    example: (
      <>
        <Stack space="12dp">
          <Stack divider={<Guide />}>
            <Text size={size} weight={weight}>
              {loremIpsum}
            </Text>
            <Text numberOfLines={1} size={size} weight={weight}>
              Truncated text truncated text truncated text truncated text
              truncated text truncated text
            </Text>
            <Text containsEmoji size={size} weight={weight}>
              With emoji 🌈
            </Text>
            <Text color="action" size={size} weight={weight}>
              Palette color
            </Text>
            <Text
              color={{ custom: customTextColor }}
              size={size}
              weight={weight}
            >
              Custom color
            </Text>
            <View style={{ backgroundColor: palette.greyDark, padding: 20 }}>
              <ColorModeProvider value="darkMode">
                <Stack space="12dp">
                  <Text size={size} weight={weight}>
                    Dark mode
                  </Text>
                  <Text
                    color={{ custom: customTextColor }}
                    size={size}
                    weight={weight}
                  >
                    Custom color
                  </Text>
                </Stack>
              </ColorModeProvider>
            </View>
          </Stack>
          <MockBadge>
            <Text size={size} weight={weight}>
              CENTERED TEXT
            </Text>
          </MockBadge>
          <MockBadge>
            <Text size={size} weight={weight}>
              Centered text
            </Text>
          </MockBadge>
        </Stack>
      </>
    ),
  })),
};

export default docs;
