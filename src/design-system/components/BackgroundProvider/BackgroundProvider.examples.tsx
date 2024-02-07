import React from 'react';
import { View } from 'react-native';
import { AccentColorProvider } from '../../color/AccentColorContext';
import { ColorModeProvider } from '../../color/ColorMode';
import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { BackgroundDemo } from '../../playground/BackgroundDemo';
import { Columns } from '../Columns/Columns';
import { Inset } from '../Inset/Inset';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';
import { BackgroundProvider } from './BackgroundProvider';

const darkAccentColor = 'green';
const lightAccentColor = 'yellow';

export const standardBackgrounds: Example = {
  name: 'Standard backgrounds',
  Example: () =>
    source(
      <Columns space="20px">
        <Stack space="10px">
          <Text color="label" size="17pt" weight="bold">
            Light mode
          </Text>
          <ColorModeProvider value="light">
            <BackgroundDemo />
          </ColorModeProvider>
        </Stack>
        <Stack space="10px">
          <Text color="label" size="17pt" weight="bold">
            Dark mode
          </Text>
          <ColorModeProvider value="dark">
            <BackgroundDemo />
          </ColorModeProvider>
        </Stack>
      </Columns>
    ),
};

export const customAccentColorDark: Example = {
  name: 'With custom accent color (dark)',
  Example: () =>
    source(
      <AccentColorProvider color={darkAccentColor}>
        <BackgroundProvider color="accent">
          {({ backgroundStyle }) => (
            <View style={backgroundStyle}>
              <Inset space="20px">
                <Stack space="10px">
                  <Text color="label" size="17pt" weight="bold">
                    {darkAccentColor}
                  </Text>
                  <Text color="labelSecondary" size="17pt" weight="bold">
                    {darkAccentColor}
                  </Text>
                </Stack>
              </Inset>
            </View>
          )}
        </BackgroundProvider>
      </AccentColorProvider>
    ),
};

export const customAccentColorLight: Example = {
  name: 'With custom accent color (light)',
  Example: () =>
    source(
      <AccentColorProvider color={lightAccentColor}>
        <BackgroundProvider color="accent">
          {({ backgroundStyle }) => (
            <View style={backgroundStyle}>
              <Inset space="20px">
                <Stack space="10px">
                  <Text color="primary (Deprecated)" size="17pt" weight="bold">
                    {lightAccentColor}
                  </Text>
                  <Text color="secondary50 (Deprecated)" size="17pt" weight="bold">
                    {lightAccentColor}
                  </Text>
                </Stack>
              </Inset>
            </View>
          )}
        </BackgroundProvider>
      </AccentColorProvider>
    ),
};
