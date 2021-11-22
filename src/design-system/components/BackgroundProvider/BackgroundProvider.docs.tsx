/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { View } from 'react-native';
import { AccentColorProvider } from '../../color/AccentColorContext';
import { ColorModeProvider, useColorMode } from '../../color/ColorMode';
import { Docs } from '../../playground/Docs';
import { Columns } from '../Columns/Columns';
import { Inset } from '../Inset/Inset';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';
import { BackgroundProvider } from './BackgroundProvider';

const darkAccentColor = 'green';
const lightAccentColor = 'yellow';

function BackgroundProviderDemo() {
  const { backgroundColors } = useColorMode();

  return (
    <>
      {(Object.keys(backgroundColors) as (keyof typeof backgroundColors)[])
        .sort()
        .map(color => (
          <BackgroundProvider color={color} key={color}>
            {backgroundStyle => (
              <View style={backgroundStyle}>
                <Inset space="19px">
                  <Stack space="10px">
                    <Text color="primary" weight="bold">
                      {color}
                    </Text>
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
        <Columns space="19px">
          <Stack space="10px">
            <Text weight="bold">Light mode</Text>
            <ColorModeProvider value="light">
              <BackgroundProviderDemo />
            </ColorModeProvider>
          </Stack>
          <Stack space="10px">
            <Text weight="bold">Dark mode</Text>
            <ColorModeProvider value="dark">
              <BackgroundProviderDemo />
            </ColorModeProvider>
          </Stack>
        </Columns>
      ),
    },
    {
      name: 'With custom accent color (dark)',
      Example: () => (
        <AccentColorProvider color={darkAccentColor}>
          <BackgroundProvider color="accent">
            {backgroundStyle => (
              <View style={backgroundStyle}>
                <Inset space="19px">
                  <Stack space="10px">
                    <Text color="primary" weight="bold">
                      {darkAccentColor}
                    </Text>
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
        <AccentColorProvider color={lightAccentColor}>
          <BackgroundProvider color="accent">
            {backgroundStyle => (
              <View style={backgroundStyle}>
                <Inset space="19px">
                  <Stack space="10px">
                    <Text color="primary" weight="bold">
                      {lightAccentColor}
                    </Text>
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
