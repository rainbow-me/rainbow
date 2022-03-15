import React from 'react';
import { PressableProps } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { Box, Cover, Inset, Text } from '@rainbow-me/design-system';

export default function GradientOutlineButton({
  gradient,
  children,
  onPress,
  variant,
}: {
  gradient: string[];
  children: React.ReactNode;
  onPress: PressableProps['onPress'];
  variant?: 'circular';
}) {
  return (
    <Box
      alignItems="center"
      as={ButtonPressAnimation}
      height="40px"
      justifyContent="center"
      // @ts-expect-error JavaScript component
      onPress={onPress}
      style={{
        ...(variant === 'circular' && {
          width: 40,
        }),
      }}
    >
      <Cover>
        <Box
          as={LinearGradient}
          background="body"
          borderRadius={23}
          colors={gradient}
          end={{ x: 1, y: 0 }}
          height="full"
          shadow={{
            custom: {
              android: {
                color: { custom: 'rgb(52, 163, 180)' },
                elevation: 30,
                opacity: 0.3,
              },
              ios: [
                {
                  blur: 15,
                  color: { custom: 'rgb(52, 163, 180)' },
                  offset: { x: 0, y: 5 },
                  opacity: 0.3,
                },
                {
                  blur: 30,
                  color: { custom: 'rgb(37, 41, 46)' },
                  offset: { x: 0, y: 10 },
                  opacity: 0.15,
                },
              ],
            },
          }}
          start={{ x: 0, y: 0 }}
          style={{ zIndex: 0 }}
          width="full"
        />
      </Cover>
      <Cover>
        <Box style={{ height: '100%', padding: 2, width: '100%' }}>
          <Box background="body" borderRadius={23} height="full" width="full" />
        </Box>
      </Cover>
      <Inset horizontal={variant !== 'circular' ? '15px' : undefined}>
        <Text size="16px" weight="heavy">
          {children}
        </Text>
      </Inset>
    </Box>
  );
}
