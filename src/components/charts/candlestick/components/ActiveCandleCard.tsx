import React, { memo, useCallback } from 'react';
import { View, FontVariant, StyleProp, ViewStyle } from 'react-native';
import Animated, { SharedValue, useDerivedValue, useAnimatedStyle } from 'react-native-reanimated';
import { AnimatedText, Text, useForegroundColor } from '@/design-system';
import { NativeCurrencyKey } from '@/entities';
import { convertAmountToNativeDisplayWorklet as formatPrice } from '@/helpers/utilities';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { Bar } from '../types';

export const ActiveCandleCard = memo(function ActiveCandleCard({
  activeCandle,
  activeCandleCardConfig,
  currency,
}: {
  activeCandle: SharedValue<Bar | undefined>;
  activeCandleCardConfig: { height: number; style: StyleProp<ViewStyle> };
  currency: NativeCurrencyKey;
}) {
  const separatorTertiary = useForegroundColor('separatorTertiary');
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');
  const labelSecondary = useForegroundColor('labelSecondary');

  const selectCandleLabel = useCallback(
    (candle: SharedValue<Bar | undefined>, field: keyof Bar) => {
      'worklet';
      if (!candle.value) return '';
      return formatPrice(candle.value[field], currency);
    },
    [currency]
  );

  const styles = {
    row: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    column: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0,
    },
    label: {
      minWidth: 36,
    },
    price: {
      fontVariant: ['tabular-nums'] as FontVariant[],
      textAlign: 'right',
    },
    priceChangeContainer: {
      borderCurve: 'continuous',
      borderWidth: 1,
      paddingVertical: 5,
      borderRadius: 8,
      overflow: 'hidden',
      paddingHorizontal: 4.5,
    },
    priceAndChangeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    separator: {
      height: 1,
      width: '100%',
      backgroundColor: separatorTertiary,
    },
  } as const;

  const priceChange = useDerivedValue(() => {
    'worklet';
    const candle = activeCandle.value;
    if (!candle) return 0;
    return ((candle.c - candle.o) / candle.o) * 100;
  });

  const priceChangeText = useDerivedValue(() => {
    const value = priceChange.value;
    const directionString = value > 0 ? '↑' : value < 0 ? '↓' : '';
    const formattedPercentageChange = toFixedWorklet(Math.abs(value), 2);

    return `${directionString}${formattedPercentageChange}%`;
  });

  const priceChangeColor = useDerivedValue(() => {
    return priceChange.value === 0 ? labelSecondary : priceChange.value > 0 ? green : red;
  });

  const priceChangeTextStyle = useAnimatedStyle(() => {
    return {
      color: priceChangeColor.value,
    };
  });

  const priceChangeContainerStyle = useAnimatedStyle(() => {
    return {
      borderColor: opacityWorklet(priceChangeColor.value, 0.28),
    };
  });

  return (
    <View
      style={[
        activeCandleCardConfig.style,
        {
          borderCurve: 'continuous',
          height: activeCandleCardConfig.height,
          overflow: 'hidden',
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.row}>
          <View style={styles.column}>
            <Text color="labelQuaternary" size="13pt" weight="bold" style={styles.label}>
              {'Open'}
            </Text>
            <AnimatedText
              selector={candle => {
                'worklet';
                return selectCandleLabel(candle, 'o');
              }}
              color="labelSecondary"
              size="13pt"
              weight="bold"
              style={styles.price}
            >
              {activeCandle}
            </AnimatedText>
          </View>

          <View style={styles.column}>
            <Text color="labelQuaternary" size="13pt" weight="bold" style={styles.label}>
              {'Close'}
            </Text>
            <View style={styles.priceAndChangeContainer}>
              <AnimatedText
                selector={candle => {
                  'worklet';
                  return selectCandleLabel(candle, 'c');
                }}
                color="labelSecondary"
                size="13pt"
                weight="bold"
                style={styles.price}
              >
                {activeCandle}
              </AnimatedText>
              <Animated.View style={[priceChangeContainerStyle, styles.priceChangeContainer]}>
                <AnimatedText size="13pt" weight="bold" style={[styles.price, priceChangeTextStyle]}>
                  {priceChangeText}
                </AnimatedText>
              </Animated.View>
            </View>
          </View>
        </View>
        <View style={styles.separator} />
        <View style={styles.row}>
          <View style={styles.column}>
            <Text color="labelQuaternary" size="13pt" weight="bold" style={styles.label}>
              {'Low'}
            </Text>
            <AnimatedText
              selector={candle => {
                'worklet';
                return selectCandleLabel(candle, 'l');
              }}
              color="labelSecondary"
              size="13pt"
              weight="bold"
              style={styles.price}
            >
              {activeCandle}
            </AnimatedText>
          </View>

          <View style={styles.column}>
            <Text color="labelQuaternary" size="13pt" weight="bold" style={styles.label}>
              {'High'}
            </Text>
            <View style={styles.priceAndChangeContainer}>
              <AnimatedText
                selector={candle => {
                  'worklet';
                  return selectCandleLabel(candle, 'h');
                }}
                color="labelSecondary"
                size="13pt"
                weight="bold"
                style={styles.price}
              >
                {activeCandle}
              </AnimatedText>
              <Animated.View
                style={[
                  priceChangeContainerStyle,
                  styles.priceChangeContainer,
                  {
                    // This is a hack to ensure the close and high labels are left aligned identically
                    opacity: 0,
                  },
                ]}
              >
                <AnimatedText size="13pt" weight="bold" style={[styles.price, priceChangeTextStyle]}>
                  {priceChangeText}
                </AnimatedText>
              </Animated.View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});
