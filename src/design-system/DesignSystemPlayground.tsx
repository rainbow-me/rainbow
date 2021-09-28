import React, { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useHideSplashScreen } from '../hooks';
import { Text } from '.';

const pink = 'rgba(255,0,0,0.2)';

const TypeSeparator = () => (
  <View style={{ backgroundColor: pink, height: 16 }} />
);

const Spacer = ({ size = 'large' }: { size?: 'small' | 'large' }) => (
  <View style={{ height: size === 'large' ? 44 : 12 }} />
);

const MockButton = ({ children }: { children: ReactNode }) => (
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

const text = [
  { tagline: 'Title text', variant: 'title' },
  { tagline: 'Heading text', variant: 'heading' },
  { tagline: 'Body text (large)', variant: 'bodyLarge' },
  { tagline: 'Body text', variant: 'body' },
  { tagline: 'Body text (thick)', variant: 'bodyThick' },
  { tagline: 'Body text (small, thick)', variant: 'smallBodyThick' },
] as const;

export const DesignSystemPlayground = () => {
  useHideSplashScreen()();

  return (
    <ScrollView>
      <View style={{ paddingHorizontal: 8, paddingVertical: 50 }}>
        {text.map(({ variant, tagline }, i) => (
          <>
            {i > 0 ? <Spacer /> : null}
            <TypeSeparator />
            <Text variant={variant}>{tagline}</Text>
            <TypeSeparator />
            <Text variant={variant}>{loremIpsum}</Text>
            <TypeSeparator />
            <Spacer size="small" />
            <MockButton>
              <Text variant={variant}>CENTERED TEXT</Text>
            </MockButton>
            <Spacer size="small" />
            <MockButton>
              <Text variant={variant}>Centered text</Text>
            </MockButton>
          </>
        ))}
      </View>
    </ScrollView>
  );
};
