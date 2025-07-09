import { PANEL_COLOR_DARK } from '@/components/SmoothPager/ListPanel';
import { BlurGradient } from '@/components/blur/BlurGradient';
import type { RainbowToast } from '@/components/rainbow-toast/types';
import { removeToast, startRemoveToast, useRainbowToasts } from '@/components/rainbow-toast/useRainbowToasts';
import { Box, globalColors, useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';
import { useDimensions } from '@/hooks';
import { fonts } from '@/styles';
import React, { PropsWithChildren, useCallback, useEffect, useMemo } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, WithSpringConfig } from 'react-native-reanimated';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { TruncatedText } from '../text';

export function RainbowToastDisplay() {
  const toasts = useRainbowToasts();
  const insets = useSafeAreaInsets();
  const { width: deviceWidth } = useDimensions();

  console.log('toasts', toasts);

  return (
    <Box zIndex={100_000} position="absolute" top="0px" left="0px" width={deviceWidth} bottom="0px" pointerEvents="box-none">
      {toasts.map(toast => {
        return <RainbowToast insets={insets} key={toast.id} toast={toast} />;
      })}
    </Box>
  );
}

const springConfig: WithSpringConfig = {
  damping: 14,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
  stiffness: 121.6,
};

const DISMISS_THRESHOLD_PERCENTAGE = 0.15;
const DISMISS_VELOCITY_THRESHOLD = 3;

type Props = PropsWithChildren<{
  testID?: string;
  toast: RainbowToast;
  insets: EdgeInsets;
}>;

const sfSymbols = {
  check: '􀆅',
};

// const colors = {
//   green: {
//     background: '#3ECF5BE5',
//   },
// };

function RainbowToast({ toast, testID, insets }: Props) {
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();
  const { width: deviceWidth } = useDimensions();
  const visible = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const height = 60;
  const { index, id } = toast;
  const gap = index * 4;
  const distance = index * height + gap + insets.top;

  useEffect(() => {
    visible.value = withSpring(1, springConfig);
  }, [visible]);

  useEffect(() => {
    translateY.value = withSpring(distance, springConfig);
  }, [distance, translateY]);

  const removeToastFinish = useCallback(() => {
    removeToast(id);
  }, [id]);

  const { panHandlers } = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          translateX.value = gestureState.dx;
        },
        onPanResponderRelease: (_, gestureState) => {
          const dismissThreshold = deviceWidth * DISMISS_THRESHOLD_PERCENTAGE;

          if (Math.abs(gestureState.dx) > dismissThreshold && Math.abs(gestureState.vx) > DISMISS_VELOCITY_THRESHOLD) {
            const toValue = gestureState.dx > 0 ? deviceWidth : -deviceWidth;
            startRemoveToast(id);
            translateX.value = withSpring(toValue, { damping: 20, stiffness: 90 }, finished => {
              if (finished) {
                runOnJS(removeToastFinish);
              }
            });
          } else {
            translateX.value = withSpring(0, springConfig);
          }
        },
      }),
    [deviceWidth, id, removeToastFinish, translateX]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const opacityY = visible.value;
    const opacityX = interpolate(Math.abs(translateX.value), [0, deviceWidth / 2], [1, 0], 'clamp');

    return {
      opacity: opacityY * opacityX,
      transform: [{ translateY: translateY.value }, { translateX: translateX.value }],
    };
  });

  const foregroundColor = isDarkMode ? colors.whiteLabel : colors.dark;

  let contents: React.ReactNode = null;

  switch (toast.type) {
    case 'swap': {
      contents = (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          {/* <Icon color={colors.whiteLabel} marginTop={3} name="checkmark" /> */}
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 100,
              borderWidth: 2,
              borderColor: colors.green,
              shadowColor: colors.green,
              shadowRadius: 12,
              shadowOpacity: 1,
              shadowOffset: { height: 4, width: 0 },
            }}
          >
            {/* background at 90% */}
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: colors.green,
                  borderRadius: 100,
                  overflow: 'hidden',
                  opacity: 0.9,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
            >
              <Text
                allowFontScaling={false}
                style={{ fontSize: 12, fontFamily: fonts.family.SFProRounded, color: foregroundColor, fontWeight: '800' }}
              >
                {sfSymbols.check}
              </Text>
            </View>
          </View>

          <View style={{ gap: 4 }}>
            <TruncatedText color={foregroundColor} size="smedium" weight="bold">
              Swapped
            </TruncatedText>

            <TruncatedText color={foregroundColor} opacity={0.5} size={12} weight="bold">
              {toast.fromToken} <Text style={{ fontWeight: '200' }}>􀄫</Text> {toast.toToken}
            </TruncatedText>
          </View>
        </View>
      );
    }
  }

  return (
    <Animated.View style={animatedStyle}>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          shadowRadius: 10,
          shadowOpacity: 1,
          shadowColor: 'rgba(0,0,0,0.25)',
          shadowOffset: { height: 4, width: 0 },
        }}
      >
        <Box
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...panHandlers}
          paddingVertical="8px"
          borderRadius={100}
          paddingHorizontal="12px"
          pointerEvents="auto"
          position="absolute"
          top="0px"
          borderColor={isDarkMode ? 'separatorSecondary' : { custom: 'rgba(255, 255, 255, 0.72)' }}
          testID={testID}
        >
          <View style={{ zIndex: 100 }}>{contents}</View>

          {IS_IOS ? (
            <>
              <BlurGradient
                gradientPoints={[
                  { x: 0.5, y: 1.2 },
                  { x: 0.5, y: 0 },
                ]}
                height={height}
                intensity={16}
                saturation={1.5}
                style={StyleSheet.absoluteFill}
                width={200}
              />
              <LinearGradient
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                colors={
                  isDarkMode
                    ? ['rgba(57, 58, 64, 0.36)', 'rgba(57, 58, 64, 0.32)']
                    : ['rgba(255, 255, 255, 0.36)', 'rgba(255, 255, 255, 0.32)']
                }
                style={StyleSheet.absoluteFill}
              />
            </>
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? PANEL_COLOR_DARK : globalColors.white100 }]} />
          )}

          {isDarkMode && (
            <LinearGradient
              end={{ x: 0.5, y: 1 }}
              colors={['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0)']}
              start={{ x: 0.5, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          )}
        </Box>
      </View>
    </Animated.View>
  );
}
