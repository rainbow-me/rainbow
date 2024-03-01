import React from 'react';
import { StyleSheet, Text as RNText } from 'react-native';
import Animated from 'react-native-reanimated';

import { Box, Cover, Text, useForegroundColor } from '@/design-system';
import { useDimensions } from '@/hooks';
import { useTheme } from '@/theme';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';

export const NeonButton = ({ color, label, onPress, width }: { color?: string; label: string; onPress?: () => void; width?: number }) => {
  const { width: deviceWidth } = useDimensions();
  const { colors } = useTheme();
  const green = useForegroundColor('green');

  return (
    <ButtonPressAnimation hapticType="impactHeavy" onPress={onPress} scaleTo={0.94} style={styles.neonButtonWrapper} transformOrigin="top">
      <Animated.View
        style={[
          styles.neonButton,
          {
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: color || green,
            shadowColor: color || green,
            width: width ?? deviceWidth - 64,
          },
        ]}
      >
        <Cover>
          <Box
            borderRadius={11}
            height={{ custom: 46 }}
            style={[
              styles.neonButtonFill,
              {
                backgroundColor: colors.alpha(color || green, 0.1),
              },
            ]}
            width={{ custom: width ? width - 2 : deviceWidth - 66 }}
          />
        </Cover>
        <RNText
          style={[
            styles.neonButtonText,
            {
              textShadowColor: colors.alpha(color || green, 0.6),
            },
          ]}
        >
          <Text align="center" color={color ? { custom: color } : 'green'} size="20pt" weight="heavy">
            {label}
          </Text>
        </RNText>
      </Animated.View>
    </ButtonPressAnimation>
  );
};

const styles = StyleSheet.create({
  neonButtonWrapper: {
    alignSelf: 'center',
  },
  neonButton: {
    alignContent: 'center',
    backgroundColor: '#191A1C',
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 48,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 13 },
    shadowOpacity: 0.2,
    shadowRadius: 26,
  },
  neonButtonFill: {
    marginLeft: -((1 / 3) * 2),
    marginTop: -((1 / 3) * 2),
  },
  neonButtonText: {
    margin: -16,
    padding: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
