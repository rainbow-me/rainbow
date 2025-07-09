import { PANEL_COLOR_DARK } from '@/components/SmoothPager/ListPanel';
import { BlurGradient } from '@/components/blur/BlurGradient';
import type { RainbowToast, RainbowToastWithIndex } from '@/components/rainbow-toast/types';
import { removeToast, showToast, startRemoveToast, updateToast, useRainbowToasts } from '@/components/rainbow-toast/useRainbowToasts';
import { Box, globalColors, useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';
import { useDimensions } from '@/hooks';
import usePendingTransactions from '@/hooks/usePendingTransactions';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { fonts } from '@/styles';
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
  withTiming,
} from 'react-native-reanimated';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { TruncatedText } from '../text';

export function RainbowToastDisplay() {
  const toasts = useRainbowToasts();
  const insets = useSafeAreaInsets();
  const { width: deviceWidth } = useDimensions();
  const { pendingTransactions } = usePendingTransactions();
  const processedTxs = useRef(new Set<string>());

  console.log('toasts', toasts);
  console.log('pendingTransactions', pendingTransactions);

  useEffect(() => {
    pendingTransactions.forEach(tx => {
      if (!processedTxs.current.has(tx.hash) && tx.type === 'swap') {
        processedTxs.current.add(tx.hash);

        showToast({
          id: tx.hash,
          type: 'swap',
          state: 'swapping',
          fromToken: tx.from || 'Unknown',
          toToken: tx.to || 'Unknown',
          action: () => {
            Navigation.handleAction(Routes.TRANSACTION_DETAILS, {
              transaction: tx,
            });
          },
        });
      }
    });
  }, [pendingTransactions]);

  useEffect(() => {
    pendingTransactions.forEach(tx => {
      if (processedTxs.current.has(tx.hash) && tx.status === 'confirmed') {
        updateToast(tx.hash, { state: 'swapped' });
      }
    });
  }, [pendingTransactions]);

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

const DISMISS_THRESHOLD_PERCENTAGE = 0.1;
const DISMISS_VELOCITY_THRESHOLD = 5;

type Props = PropsWithChildren<{
  testID?: string;
  toast: RainbowToastWithIndex;
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
  const lastChangeX = useSharedValue(0);

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
    console.log('wt');
    removeToast(id);
  }, [id]);

  const removeToastStart = useCallback(() => {
    startRemoveToast(id);
  }, [id]);

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .minDistance(10)
      .onUpdate(event => {
        translateX.value = event.translationX;
      })
      .onChange(event => {
        // at least on iOS simulator velocityX is always 0 so using this
        lastChangeX.value = event.changeX;
      })
      .onEnd(event => {
        const velocityX = lastChangeX.value;
        lastChangeX.value = 0;

        const dismissThreshold = deviceWidth * DISMISS_THRESHOLD_PERCENTAGE;
        const isDraggedFarEnough = Math.abs(event.translationX) > dismissThreshold;
        const isDraggedFastEnough = Math.abs(velocityX) >= DISMISS_VELOCITY_THRESHOLD;

        if (isDraggedFarEnough && isDraggedFastEnough) {
          const toValue = event.translationX > 0 ? deviceWidth : -deviceWidth;
          runOnJS(removeToastStart)();
          translateX.value = withSpring(toValue, { damping: 20, stiffness: 90 }, finished => {
            if (finished) {
              runOnJS(removeToastFinish)();
            }
          });
        } else {
          translateX.value = withSpring(0, springConfig);
        }
      });
  }, [deviceWidth, lastChangeX, removeToastFinish, removeToastStart, translateX]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacityY = visible.value;
    const opacityX = interpolate(Math.abs(translateX.value), [0, deviceWidth / 2], [1, 0], 'clamp');

    return {
      opacity: opacityY * opacityX,
      transform: [{ translateY: translateY.value }, { translateX: translateX.value }],
    };
  });

  const foregroundColor = isDarkMode ? colors.whiteLabel : colors.dark;

  const isPressed = useSharedValue(false);

  const pressGesture = useMemo(() => {
    return Gesture.Tap()
      .maxDuration(2000)
      .onTouchesDown(() => {
        isPressed.value = true;
      })
      .onTouchesUp(() => {
        isPressed.value = false;
      })
      .onFinalize(() => {
        isPressed.value = false;
      })
      .onEnd(() => {
        if (toast.action) {
          runOnJS(toast.action)();
        }
      });
  }, [isPressed, toast]);

  const combinedGesture = useMemo(() => {
    return Gesture.Exclusive(pressGesture, panGesture);
  }, [pressGesture, panGesture]);

  const pressStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(isPressed.value ? 0.9 : 1) }],
      opacity: withTiming(isPressed.value ? 0.6 : 0.9),
    };
  });

  let contents: React.ReactNode = null;

  switch (toast.type) {
    case 'swap': {
      contents = (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
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
              {toast.state === 'swapping' ? 'Swapping...' : 'Swapped'}
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
    <GestureDetector gesture={combinedGesture}>
      <Animated.View style={animatedStyle}>
        <Animated.View
          style={[
            {
              alignItems: 'center',
              justifyContent: 'center',
              shadowRadius: 10,
              shadowOpacity: 1,
              shadowColor: 'rgba(0,0,0,0.25)',
              shadowOffset: { height: 4, width: 0 },
            },
            pressStyle,
          ]}
        >
          <Box
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
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
