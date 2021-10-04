import React, { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useHideSplashScreen } from '../hooks';
import { palette } from './color/palette';
import { ColorModeProvider, Heading, HeadingProps, Text, TextProps } from '.';

const pink = 'rgba(255,0,0,0.2)';
const customTextColor = { darkMode: 'pink', lightMode: 'red' } as const;

const TypeSeparator = () => (
  <View style={{ backgroundColor: pink, height: 16 }} />
);

const Spacer = ({ size = 'large' }: { size?: 'small' | 'large' }) => (
  <View style={{ height: size === 'large' ? 44 : 12 }} />
);

const MockBadge = ({ children }: { children: ReactNode }) => (
  <View style={{ display: 'flex', flexDirection: 'row' }}>
    <View
      style={{
        backgroundColor: pink,
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

const titleCase = (string: string) =>
  `${string[0].toUpperCase()}${string.slice(1)}`;

const headingExamples: Required<Pick<HeadingProps, 'size' | 'weight'>>[] = [
  { size: 'title', weight: 'heavy' },
  { size: 'heading', weight: 'heavy' },
];

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

export const DesignSystemPlayground = () => {
  useHideSplashScreen()();

  return (
    <ScrollView>
      <View style={{ paddingHorizontal: 8, paddingVertical: 50 }}>
        <TypeSeparator />
        <Heading>Default heading</Heading>
        <TypeSeparator />
        <Text>Default text</Text>
        <TypeSeparator />

        {headingExamples.map(({ size, weight }) => (
          <>
            <Spacer />
            <TypeSeparator />
            <Heading size={size} weight={weight}>
              {titleCase(size)} ({weight})
            </Heading>
            <TypeSeparator />
            <Heading size={size} weight={weight}>
              {loremIpsum}
            </Heading>
            <TypeSeparator />
            <View style={{ backgroundColor: palette.greyDark, padding: 20 }}>
              <ColorModeProvider value="darkMode">
                <TypeSeparator />
                <Heading size={size} weight={weight}>
                  Dark mode
                </Heading>
                <TypeSeparator />
              </ColorModeProvider>
            </View>
            <TypeSeparator />
            <Heading numberOfLines={1} size={size} weight={weight}>
              Truncated text truncated text truncated text truncated text
              truncated text truncated text
            </Heading>
            <TypeSeparator />
            <Heading containsEmoji size={size} weight={weight}>
              Heading containing emoji 🌈
            </Heading>
            <TypeSeparator />
            <Spacer size="small" />
            <MockBadge>
              <Heading size={size} weight={weight}>
                CENTERED TEXT
              </Heading>
            </MockBadge>
            <Spacer size="small" />
            <MockBadge>
              <Heading size={size} weight={weight}>
                Centered text
              </Heading>
            </MockBadge>
          </>
        ))}
        {textExamples.map(({ size, weight }) => (
          <>
            <Spacer />
            <TypeSeparator />
            <Text size={size} weight={weight}>
              {titleCase(size)} text ({weight})
            </Text>
            <TypeSeparator />
            <Text size={size} weight={weight}>
              {loremIpsum}
            </Text>
            <TypeSeparator />
            <Text color="action" size={size} weight={weight}>
              Palette color
            </Text>
            <TypeSeparator />
            <Text
              color={{ custom: customTextColor }}
              size={size}
              weight={weight}
            >
              Custom color
            </Text>
            <TypeSeparator />
            <View style={{ backgroundColor: palette.greyDark, padding: 20 }}>
              <ColorModeProvider value="darkMode">
                <TypeSeparator />
                <Text size={size} weight={weight}>
                  Dark mode
                </Text>
                <TypeSeparator />
                <Text
                  color={{ custom: customTextColor }}
                  size={size}
                  weight={weight}
                >
                  Custom color
                </Text>
                <TypeSeparator />
              </ColorModeProvider>
            </View>
            <TypeSeparator />
            <Text numberOfLines={1} size={size} weight={weight}>
              Truncated text truncated text truncated text truncated text
              truncated text truncated text
            </Text>
            <TypeSeparator />
            <Text containsEmoji size={size} weight={weight}>
              Text containing emoji 🌈
            </Text>
            <TypeSeparator />
            <Spacer size="small" />
            <MockBadge>
              <Text size={size} weight={weight}>
                CENTERED TEXT
              </Text>
            </MockBadge>
            <Spacer size="small" />
            <MockBadge>
              <Text size={size} weight={weight}>
                Centered text
              </Text>
            </MockBadge>
          </>
        ))}
      </View>
    </ScrollView>
  );
};
