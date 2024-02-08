import React from 'react';
import { View } from 'react-native';
import { ColorModeProvider } from '../../color/ColorMode';
import { palettes } from '../../color/palettes';
import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Guide } from '../../playground/Guide';
import { HeadingSize, typeHierarchy } from '../../typography/typeHierarchy';
import { Inline } from '../Inline/Inline';
import { Stack } from '../Stack/Stack';
import { Heading } from './Heading';

const loremIpsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

export const sizes: Example[] = (Object.keys(typeHierarchy.heading) as HeadingSize[]).map(size => ({
  name: size,
  Example: () =>
    source(
      <>
        <Stack space="10px">
          <View>
            <Guide />
            <Heading color="primary (Deprecated)" size={size} weight="bold">
              {loremIpsum}
            </Heading>
            <Guide />
            <Heading numberOfLines={1} color="primary (Deprecated)" size={size} weight="bold">
              Truncated text truncated text truncated text truncated text truncated text truncated text
            </Heading>
            <Guide />
          </View>
          <Inline alignVertical="center" space="10px">
            <View style={{ backgroundColor: 'rgba(255,0,0,0.2)' }}>
              <Heading color="primary (Deprecated)" size={size} weight="bold">
                Bounding Box
              </Heading>
            </View>
            <View style={{ position: 'relative' }}>
              <Heading color="primary (Deprecated)" size={size} weight="bold">
                Bounding Box
              </Heading>
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#ffd4d3',
                  zIndex: 1,
                }}
              />
            </View>
          </Inline>
        </Stack>
      </>
    ),
}));

export const withEmoji: Example = {
  name: 'With emoji',
  Example: () =>
    source(
      <View>
        <Guide />
        <Heading containsEmoji color="primary (Deprecated)" size="20px / 22px (Deprecated)" weight="heavy">
          Heading with emoji 🌈
        </Heading>
        <Guide />
      </View>
    ),
};

export const withTruncation: Example = {
  name: 'With truncation',
  Example: () =>
    source(
      <View>
        <Guide />
        <Heading numberOfLines={1} color="primary (Deprecated)" size="20px / 22px (Deprecated)" weight="heavy">
          Truncated text truncated text truncated text truncated text truncated text truncated text
        </Heading>
        <Guide />
      </View>
    ),
};

export const withColor: Example = {
  name: 'With color',
  Example: () =>
    source(
      <View>
        <View
          style={{
            backgroundColor: palettes.dark.backgroundColors['body (Deprecated)'].color,
            padding: 24,
          }}
        >
          <Stack space="24px">
            <ColorModeProvider value="dark">
              <Heading color="primary (Deprecated)" size="20px / 22px (Deprecated)" weight="heavy">
                Dark mode
              </Heading>
            </ColorModeProvider>
            <ColorModeProvider value="darkTinted">
              <Heading color="primary (Deprecated)" size="20px / 22px (Deprecated)" weight="heavy">
                Dark tinted mode
              </Heading>
            </ColorModeProvider>
          </Stack>
        </View>
      </View>
    ),
};
