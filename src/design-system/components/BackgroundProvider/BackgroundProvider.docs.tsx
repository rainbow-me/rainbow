/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { View } from 'react-native';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../color/AccentColorContext' was resolv... Remove this comment to see the full error message
import { AccentColorProvider } from '../../color/AccentColorContext';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../color/ColorMode' was resolved to '/U... Remove this comment to see the full error message
import { ColorModeProvider, useColorMode } from '../../color/ColorMode';
import { Docs } from '../../playground/Docs';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Columns/Columns' was resolved to '/User... Remove this comment to see the full error message
import { Columns } from '../Columns/Columns';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Inset/Inset' was resolved to '/Users/ni... Remove this comment to see the full error message
import { Inset } from '../Inset/Inset';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Stack/Stack' was resolved to '/Users/ni... Remove this comment to see the full error message
import { Stack } from '../Stack/Stack';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Text/Text' was resolved to '/Users/nick... Remove this comment to see the full error message
import { Text } from '../Text/Text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './BackgroundProvider' was resolved to '/Us... Remove this comment to see the full error message
import { BackgroundProvider } from './BackgroundProvider';

const darkAccentColor = 'green';
const lightAccentColor = 'yellow';

function BackgroundProviderDemo() {
  const { backgroundColors } = useColorMode();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <>
      {(Object.keys(backgroundColors) as (keyof typeof backgroundColors)[])
        .sort()
        .map(color => (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <BackgroundProvider color={color} key={color}>
            {(backgroundStyle: any) => (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <View style={backgroundStyle}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Inset space="19px">
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Stack space="10px">
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <Text color="primary" weight="bold">
                      {color}
                    </Text>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <Text color="secondary50" weight="bold">
                      {color}
                    </Text>
                  </Stack>
                </Inset>
              </View>
            )}
          </BackgroundProvider>
        ))}
    </>
  );
}

const docs: Docs = {
  name: 'BackgroundProvider',
  category: 'Content',
  examples: [
    {
      name: 'Standard backgrounds',
      Example: () => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Columns space="19px">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Stack space="10px">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text weight="bold">Light mode</Text>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ColorModeProvider value="light">
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <BackgroundProviderDemo />
            </ColorModeProvider>
          </Stack>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Stack space="10px">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text weight="bold">Dark mode</Text>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ColorModeProvider value="dark">
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <BackgroundProviderDemo />
            </ColorModeProvider>
          </Stack>
        </Columns>
      ),
    },
    {
      name: 'With custom accent color (dark)',
      Example: () => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <AccentColorProvider color={darkAccentColor}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <BackgroundProvider color="accent">
            {(backgroundStyle: any) => (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <View style={backgroundStyle}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Inset space="19px">
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Stack space="10px">
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <Text color="primary" weight="bold">
                      {darkAccentColor}
                    </Text>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <Text color="secondary50" weight="bold">
                      {darkAccentColor}
                    </Text>
                  </Stack>
                </Inset>
              </View>
            )}
          </BackgroundProvider>
        </AccentColorProvider>
      ),
    },
    {
      name: 'With custom accent color (light)',
      Example: () => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <AccentColorProvider color={lightAccentColor}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <BackgroundProvider color="accent">
            {(backgroundStyle: any) => (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <View style={backgroundStyle}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Inset space="19px">
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Stack space="10px">
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <Text color="primary" weight="bold">
                      {lightAccentColor}
                    </Text>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <Text color="secondary50" weight="bold">
                      {lightAccentColor}
                    </Text>
                  </Stack>
                </Inset>
              </View>
            )}
          </BackgroundProvider>
        </AccentColorProvider>
      ),
    },
  ],
};

export default docs;
