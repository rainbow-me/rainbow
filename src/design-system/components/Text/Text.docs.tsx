/* eslint-disable sort-keys-fix/sort-keys-fix */
import React, { ReactNode } from 'react';
import { View } from 'react-native';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../color/AccentColorContext' was resolv... Remove this comment to see the full error message
import { AccentColorProvider } from '../../color/AccentColorContext';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../color/ColorMode' was resolved to '/U... Remove this comment to see the full error message
import { ColorModeProvider } from '../../color/ColorMode';
import { palettes } from '../../color/palettes';
import { CustomColor } from '../../color/useForegroundColor';
import { Docs } from '../../playground/Docs';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../playground/Guide' was resolved to '/... Remove this comment to see the full error message
import { Guide } from '../../playground/Guide';
import { fontWeights } from '../../typography/fontWeights';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Inline/Inline' was resolved to '/Users/... Remove this comment to see the full error message
import { Inline } from '../Inline/Inline';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Stack/Stack' was resolved to '/Users/ni... Remove this comment to see the full error message
import { Stack } from '../Stack/Stack';
// @ts-expect-error ts-migrate(6142) FIXME: Module './Text' was resolved to '/Users/nickbytes/... Remove this comment to see the full error message
import { Text, TextProps } from './Text';

const textExamples: Required<Pick<TextProps, 'size' | 'weight'>>[] = [
  { size: '18px', weight: 'bold' },
  { size: '16px', weight: 'bold' },
  { size: '14px', weight: 'bold' },
  { size: '11px', weight: 'bold' },
];

const MockBadge = ({ children }: { children: ReactNode }) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <View style={{ display: 'flex', flexDirection: 'row' }}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
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

const customTextColor: CustomColor = {
  custom: {
    dark: 'salmon',
    darkTinted: 'pink',
    light: 'red',
  },
};

const docs: Docs = {
  name: 'Text',
  category: 'Content',
  examples: [
    ...textExamples.map(({ size, weight }) => ({
      name: `${size} (${weight})`,
      Example: () => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Stack space="10px">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <View>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Guide />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text size={size} weight={weight}>
              {loremIpsum}
            </Text>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Guide />
          </View>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Inline space="10px">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <MockBadge>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Text size={size} weight={weight}>
                CENTERED
              </Text>
            </MockBadge>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <MockBadge>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Text size={size} weight={weight}>
                Centered
              </Text>
            </MockBadge>
          </Inline>
        </Stack>
      ),
    })),
    {
      name: 'With emoji',
      Example: () => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Guide />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text containsEmoji>Text with emoji 🌈</Text>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Guide />
        </>
      ),
    },
    {
      name: 'With truncation',
      Example: () => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Guide />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text numberOfLines={1}>
            Truncated text truncated text truncated text truncated text
            truncated text truncated text
          </Text>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Guide />
        </>
      ),
    },
    {
      name: 'With weight',
      Example: () => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Stack space="10px">
          {Object.entries(fontWeights).map(([name, value]) => (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Text key={value} weight={name as keyof typeof fontWeights}>
              {name} ({value})
            </Text>
          ))}
        </Stack>
      ),
    },
    {
      name: 'With color',
      Example: () => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Stack space="12px">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text color="secondary50">Default mode</Text>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text color="action">Action color</Text>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text color="accent">Default accent color</Text>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <AccentColorProvider color="orange">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text color="accent">Custom accent color</Text>
          </AccentColorProvider>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text color={customTextColor}>Custom color</Text>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <View>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <View
              style={{
                backgroundColor: palettes.dark.backgroundColors.body.color,
                padding: 24,
              }}
            >
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Stack space="24px">
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <ColorModeProvider value="dark">
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Stack space="12px">
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <Text color="secondary50">Dark mode</Text>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <Text color={customTextColor}>Custom color</Text>
                  </Stack>
                </ColorModeProvider>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <ColorModeProvider value="darkTinted">
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Stack space="12px">
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <Text color="secondary50">Dark tinted mode</Text>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <Text color={customTextColor}>Custom color</Text>
                  </Stack>
                </ColorModeProvider>
              </Stack>
            </View>
          </View>
        </Stack>
      ),
    },
  ],
};

export default docs;
