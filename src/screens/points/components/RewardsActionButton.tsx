import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextShadow, useColorMode, useForegroundColor } from '@/design-system';
import { IS_IOS } from '@/env';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { opacity } from '@/__swaps__/utils/swaps';

export const RewardsActionButton = memo(function RewardsActionButton({
  borderRadius = 20,
  color,
  label,
  width,
}: {
  borderRadius?: number;
  color?: string;
  label: string;
  width?: number;
}) {
  const { isDarkMode } = useColorMode();
  const defaultColor = useForegroundColor('label');

  return (
    <View
      style={[
        styles.neonButtonWrapper,
        styles.neonButtonShadow,
        { shadowColor: color || defaultColor },
        isDarkMode ? {} : { shadowOpacity: 0.4 },
      ]}
    >
      <View
        style={[
          styles.neonButton,
          {
            alignItems: 'center',
            backgroundColor: isDarkMode ? opacity(color || defaultColor, IS_IOS ? 0.025 : 0.15) : 'transparent',
            borderColor: color || defaultColor,
            borderRadius,
            justifyContent: 'center',
            width: width ?? DEVICE_WIDTH - 64,
          },
        ]}
      >
        <TextShadow>
          <Text align="center" color={color ? { custom: color } : 'green'} size="20pt" weight="black">
            {label}
          </Text>
        </TextShadow>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  neonButtonWrapper: {
    alignSelf: 'center',
  },
  neonButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderWidth: 2,
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  neonButtonShadow: {
    shadowOffset: { width: 0, height: 13 },
    shadowOpacity: 0.9,
    shadowRadius: 26,
  },
});
