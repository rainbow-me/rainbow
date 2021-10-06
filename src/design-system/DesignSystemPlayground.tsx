import React, { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useHideSplashScreen } from '../hooks';
import { palette } from './color/palette';
import {
  ColorModeProvider,
  Heading,
  HeadingProps,
  MarkdownText,
  Text,
  TextProps,
} from '.';

const pink = 'rgba(255,0,0,0.2)';
const customTextColor = { darkMode: 'pink', lightMode: 'red' } as const;

const Guide = () => <View style={{ backgroundColor: pink, height: 16 }} />;

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

const markdown = `
  # Heading 1

  ## Heading 2

  ### Heading 3

  #### Heading 4

  ##### Heading 5

  ###### Heading 6

  Paragraph. ${loremIpsum}

  > Blockquote paragraph. ${loremIpsum}

  Text with **bold words.**

  Text with *italicised words.*

  Text with ~~strikethrough.~~

  Text with a [link.](http://rainbow.me)

  Text with emoji. 🌈🌈🌈

  - Bullet list
  - Bullet list
  - Bullet list with rich content

    ${loremIpsum}

    - Nested bullet list
    - Nested bullet list
    - Nested bullet list

  1. Ordered list
  2. Ordered list
  3. Ordered list with rich content

     ${loremIpsum}

     1. Nested bullet list
     2. Nested bullet list
     3. Nested bullet list

  ---

  11. Ordered list with offset
  12. Ordered list with offset

  Text with inline code. \`<MarkdownText>\`

  \`\`\`
  Multiline code block
  Multiline code block
  Multiline code block
  \`\`\`

  | Table  | Table |
  | ------ | ----------- |
  | Lorem  | ${loremIpsum} |
  | Ipsum  | ${loremIpsum} |
`;

export const DesignSystemPlayground = () => {
  useHideSplashScreen()();

  return (
    <ScrollView>
      <View style={{ paddingHorizontal: 8, paddingVertical: 50 }}>
        <Guide />
        <MarkdownText>{markdown}</MarkdownText>
        <Guide />

        <Spacer />

        <Guide />
        <Heading>Default heading</Heading>
        <Guide />
        <Text>Default text</Text>
        <Guide />

        {headingExamples.map(({ size, weight }) => (
          <>
            <Spacer />
            <Guide />
            <Heading size={size} weight={weight}>
              {titleCase(size)} ({weight})
            </Heading>
            <Guide />
            <Heading size={size} weight={weight}>
              {loremIpsum}
            </Heading>
            <Guide />
            <View style={{ backgroundColor: palette.greyDark, padding: 20 }}>
              <ColorModeProvider value="darkMode">
                <Guide />
                <Heading size={size} weight={weight}>
                  Dark mode
                </Heading>
                <Guide />
              </ColorModeProvider>
            </View>
            <Guide />
            <Heading numberOfLines={1} size={size} weight={weight}>
              Truncated text truncated text truncated text truncated text
              truncated text truncated text
            </Heading>
            <Guide />
            <Heading containsEmoji size={size} weight={weight}>
              Heading containing emoji 🌈
            </Heading>
            <Guide />
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
            <Guide />
            <Text size={size} weight={weight}>
              {titleCase(size)} text ({weight})
            </Text>
            <Guide />
            <Text size={size} weight={weight}>
              {loremIpsum}
            </Text>
            <Guide />
            <Text color="action" size={size} weight={weight}>
              Palette color
            </Text>
            <Guide />
            <Text
              color={{ custom: customTextColor }}
              size={size}
              weight={weight}
            >
              Custom color
            </Text>
            <Guide />
            <View style={{ backgroundColor: palette.greyDark, padding: 20 }}>
              <ColorModeProvider value="darkMode">
                <Guide />
                <Text size={size} weight={weight}>
                  Dark mode
                </Text>
                <Guide />
                <Text
                  color={{ custom: customTextColor }}
                  size={size}
                  weight={weight}
                >
                  Custom color
                </Text>
                <Guide />
              </ColorModeProvider>
            </View>
            <Guide />
            <Text numberOfLines={1} size={size} weight={weight}>
              Truncated text truncated text truncated text truncated text
              truncated text truncated text
            </Text>
            <Guide />
            <Text containsEmoji size={size} weight={weight}>
              Text containing emoji 🌈
            </Text>
            <Guide />
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
