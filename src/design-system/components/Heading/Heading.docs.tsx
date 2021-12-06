/* eslint-disable sort-keys-fix/sort-keys-fix */
import React, { ReactNode } from 'react';
import { View } from 'react-native';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../color/ColorMode' was resolved to '/U... Remove this comment to see the full error message
import { ColorModeProvider } from '../../color/ColorMode';
import { palettes } from '../../color/palettes';
import { Docs } from '../../playground/Docs';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../playground/Guide' was resolved to '/... Remove this comment to see the full error message
import { Guide } from '../../playground/Guide';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Inline/Inline' was resolved to '/Users/... Remove this comment to see the full error message
import { Inline } from '../Inline/Inline';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Stack/Stack' was resolved to '/Users/ni... Remove this comment to see the full error message
import { Stack } from '../Stack/Stack';
// @ts-expect-error ts-migrate(6142) FIXME: Module './Heading' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import { Heading, HeadingProps } from './Heading';

const headingExamples: Required<Pick<HeadingProps, 'size' | 'weight'>>[] = [
  { size: '23px', weight: 'bold' },
  { size: '20px', weight: 'bold' },
  { size: '18px', weight: 'bold' },
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

const docs: Docs = {
  name: 'Heading',
  category: 'Content',
  examples: [
    ...headingExamples.map(({ size, weight }) => ({
      name: `${size} (${weight})`,
      Example: () => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Stack space="10px">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <View>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Guide />
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Heading size={size} weight={weight}>
                {loremIpsum}
              </Heading>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Guide />
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Heading numberOfLines={1} size={size} weight={weight}>
                Truncated text truncated text truncated text truncated text
                truncated text truncated text
              </Heading>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Guide />
            </View>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Inline space="10px">
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <MockBadge>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Heading size={size} weight={weight}>
                  CENTERED
                </Heading>
              </MockBadge>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <MockBadge>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
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
          <Heading containsEmoji>Heading with emoji 🌈</Heading>
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
          <Heading numberOfLines={1}>
            Truncated text truncated text truncated text truncated text
            truncated text truncated text
          </Heading>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Guide />
        </>
      ),
    },
    {
      name: 'With color',
      Example: () => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <View>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <View
            style={{
              backgroundColor: palettes.dark.backgroundColors.body.color,
              padding: 24,
            }}
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Stack space="24px">
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <ColorModeProvider value="dark">
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Heading>Dark mode</Heading>
              </ColorModeProvider>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <ColorModeProvider value="darkTinted">
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
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
