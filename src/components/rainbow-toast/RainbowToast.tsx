import { PANEL_COLOR_DARK } from '@/components/SmoothPager/ListPanel';
import { BlurGradient } from '@/components/blur/BlurGradient';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import {
  type RainbowToast,
  type RainbowToastMint,
  type RainbowToastSend,
  type RainbowToastSwap,
  type RainbowToastWithIndex,
  getMintToastStatus,
  getSendToastStatus,
  getSwapToastStatus,
} from '@/components/rainbow-toast/types';
import { removeToast, showToast, startRemoveToast, updateToast, useRainbowToasts } from '@/components/rainbow-toast/useRainbowToasts';
import { Box, globalColors, useColorMode } from '@/design-system';
import { RainbowTransaction, TransactionStatus } from '@/entities';
import { IS_IOS } from '@/env';
import { useDimensions } from '@/hooks';
import usePendingTransactions from '@/hooks/usePendingTransactions';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
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
import { FullWindowOverlay } from 'react-native-screens';
import { useTheme } from '../../theme/ThemeContext';
import { TruncatedText } from '../text';

export function RainbowToastDisplay() {
  const toasts = useRainbowToasts();
  const insets = useSafeAreaInsets();
  const { pendingTransactions } = usePendingTransactions();
  const processedTxs = useRef(new Set<string>());

  console.log('toasts', toasts.length);

  useEffect(() => {
    pendingTransactions.forEach(tx => {
      if (!processedTxs.current.has(tx.hash)) {
        processedTxs.current.add(tx.hash);

        const toast = getToastFromTransaction(tx);

        console.log('toast', toast, tx);

        if (toast) {
          showToast(toast);
        }
      }
    });
  }, [pendingTransactions]);

  useEffect(() => {
    pendingTransactions.forEach(tx => {
      if (processedTxs.current.has(tx.hash)) {
        const value = getToastFromTransaction(tx);
        if (value) {
          updateToast(value);
        }
      }
    });
  }, [pendingTransactions]);

  return (
    <FullWindowOverlay>
      <Box position="absolute" top="0px" left="0px" right="0px" bottom="0px" pointerEvents="box-none">
        {toasts.map(toast => {
          return <RainbowToast insets={insets} key={toast.id} toast={toast} />;
        })}
      </Box>
    </FullWindowOverlay>
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

function getToastFromTransaction(tx: RainbowTransaction): RainbowToast | null {
  if (tx.swap) {
    const toastState = getSwapToastStatus(tx.status);
    if (toastState) {
      return {
        id: tx.hash,
        type: 'swap',
        status: toastState,
        fromChainId: tx.swap.fromChainId,
        toChainId: tx.swap.toChainId,
        action: () => {
          Navigation.handleAction(Routes.TRANSACTION_DETAILS, {
            transaction: tx,
          });
        },
      };
    }
  }

  if (tx.type === 'send') {
    const toastState = getSendToastStatus(tx.status);
    if (toastState) {
      return {
        id: tx.hash,
        type: 'send',
        status: toastState,
        amount: parseFloat(tx.value?.toString() || '0'),
        token: tx.symbol || 'ETH',
        action: () => {
          Navigation.handleAction(Routes.TRANSACTION_DETAILS, {
            transaction: tx,
          });
        },
      };
    }
  }

  if (tx.type === 'mint') {
    const toastState = getMintToastStatus(tx.status);
    if (toastState) {
      return {
        id: tx.hash,
        type: 'mint',
        status: toastState,
        name: tx.title || 'NFT',
        image: tx.description || '',
        action: () => {
          Navigation.handleAction(Routes.TRANSACTION_DETAILS, {
            transaction: tx,
          });
        },
      };
    }
  }

  return null;
}

function RainbowToast({ toast, testID, insets }: Props) {
  const { isDarkMode } = useColorMode();
  const { width: deviceWidth } = useDimensions();
  const visible = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const lastChangeX = useSharedValue(0);

  const height = 60;
  const { index, id } = toast;
  const gap = 4;
  const distance = index * gap + insets.top;

  useEffect(() => {
    visible.value = withSpring(1, springConfig);

    // Initialize translateY based on toast position
    if (translateY.value === 0) {
      if (index === 0) {
        // First toast starts from above
        translateY.value = insets.top - 80;
      } else if (index === 2) {
        // Bottom toast starts from below
        translateY.value = distance + 2;
      } else {
        // Middle toast starts at target position
        translateY.value = distance;
      }
    }
  }, [visible, translateY, distance, index, insets.top]);

  useEffect(() => {
    translateY.value = withSpring(distance, springConfig);
  }, [distance, translateY]);

  const removeToastFinish = useCallback(() => {
    removeToast(id);
  }, [id]);

  const startRemoveToastCallback = useCallback(() => {
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
          runOnJS(startRemoveToastCallback)();
          const toValue = event.translationX > 0 ? deviceWidth : -deviceWidth;
          translateX.value = withSpring(toValue, { damping: 20, stiffness: 90 }, finished => {
            if (finished) {
              runOnJS(removeToastFinish)();
            }
          });
        } else {
          translateX.value = withSpring(0, springConfig);
        }
      });
  }, [deviceWidth, lastChangeX, removeToastFinish, startRemoveToastCallback, translateX]);

  const dragStyle = useAnimatedStyle(() => {
    const opacityY = visible.value;
    const opacityX = interpolate(Math.abs(translateX.value), [0, deviceWidth / 2], [1, 0], 'clamp');
    const scale = interpolate(index, [0, 2], [1, 0.96], 'clamp');

    return {
      opacity: opacityY * opacityX,
      transform: [{ translateY: translateY.value }, { translateX: translateX.value }, { scale }],
    };
  });

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

  const pressStyleContainer = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(isPressed.value ? 0.9 : 1) }],
    };
  });

  const pressStyleContent = useAnimatedStyle(() => {
    const stackOpacity = interpolate(index, [0, 2], [1, 0.8], 'clamp') * interpolate(index, [2, 3], [1, 0], 'clamp');
    const pressOpacity = isPressed.value ? 0.6 : 0.9;

    return {
      opacity: withTiming(pressOpacity * stackOpacity),
    };
  });

  let contents: React.ReactNode = null;

  switch (toast.type) {
    case 'swap':
      contents = <SwapToastContent toast={toast} />;
      break;
    case 'send':
      contents = <SendToastContent toast={toast} />;
      break;
    case 'mint':
      contents = <MintToastContent toast={toast} />;
      break;
  }

  return (
    <GestureDetector gesture={combinedGesture}>
      <Animated.View style={[dragStyle, { zIndex: 3 - index }]}>
        <Animated.View
          style={[
            {
              alignItems: 'center',
              justifyContent: 'center',
              shadowRadius: 10,
              shadowOpacity: interpolate(index, [0, 2], [1, 0.3], 'clamp'),
              shadowColor: 'rgba(0,0,0,0.25)',
              shadowOffset: { height: 4, width: 0 },
            },
            pressStyleContainer,
          ]}
        >
          <Box
            paddingVertical="8px"
            borderRadius={100}
            paddingHorizontal="12px"
            pointerEvents="auto"
            position="absolute"
            top="0px"
            // borderColor={isDarkMode ? 'separatorSecondary' : { custom: 'rgba(255, 255, 255, 0.72)' }}
            testID={testID}
          >
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

            <Animated.View style={pressStyleContent}>{contents}</Animated.View>
          </Box>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

interface ToastContentProps {
  icon: React.ReactNode;
  title: string;
  subtitle: React.ReactNode;
}

function ToastContent({ icon, title, subtitle }: ToastContentProps) {
  const colors = useToastColors();

  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      {icon}
      <View style={{ gap: 4 }}>
        <TruncatedText color={colors.foreground} size="smedium" weight="bold">
          {title}
        </TruncatedText>
        <TruncatedText color={colors.foreground} opacity={0.5} size={12} weight="bold">
          {subtitle}
        </TruncatedText>
      </View>
    </View>
  );
}

interface SwapToastContentProps {
  toast: RainbowToastSwap;
}

const useChainsLabel = () => useBackendNetworksStore.getState().getChainsLabel();

function SwapToastContent({ toast }: SwapToastContentProps) {
  const chainsLabel = useChainsLabel();

  const icon =
    toast.status === TransactionStatus.swapped ? (
      <SFSymbolIcon name="check" />
    ) : (
      <View style={{ flexDirection: 'row' }}>
        <ChainImage chainId={toast.fromChainId} size={20} />
        <View style={{ marginLeft: -8 }}>
          <ChainImage chainId={toast.toChainId} size={20} />
        </View>
      </View>
    );

  const title = toast.status === 'swapping' ? 'Swapping...' : 'Swapped';
  const fromNetwork = chainsLabel[toast.fromChainId] || '';
  const toNetwork = chainsLabel[toast.toChainId] || '';
  const subtitle = (
    <>
      {fromNetwork} <Text style={{ fontWeight: '200' }}>􀄫</Text> {toNetwork}
    </>
  );

  return <ToastContent icon={icon} title={title} subtitle={subtitle} />;
}

const SFSymbolIcon = ({ name }: { name: keyof typeof sfSymbols }) => {
  const colors = useToastColors();

  return (
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
          style={{ fontSize: 12, fontFamily: fonts.family.SFProRounded, color: colors.foreground, fontWeight: '800' }}
        >
          {sfSymbols[name]}
        </Text>
      </View>
    </View>
  );
};

interface SendToastContentProps {
  toast: RainbowToastSend;
}

function SendToastContent({ toast }: SendToastContentProps) {
  const colors = useToastColors();

  const icon = (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: colors.clearBlue,
        shadowColor: colors.clearBlue,
        shadowRadius: 12,
        shadowOpacity: 1,
        shadowOffset: { height: 4, width: 0 },
      }}
    >
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.clearBlue,
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
          style={{ fontSize: 12, fontFamily: fonts.family.SFProRounded, color: colors.foreground, fontWeight: '800' }}
        >
          {toast.status === 'failed' ? '!' : '↗'}
        </Text>
      </View>
    </View>
  );

  const title = toast.status === 'sending' ? 'Sending...' : toast.status === 'sent' ? 'Sent' : 'Failed';
  const subtitle = `${toast.amount} ${toast.token}`;

  return <ToastContent icon={icon} title={title} subtitle={subtitle} />;
}

interface MintToastContentProps {
  toast: RainbowToastMint;
}

const useToastColors = () => {
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();
  const foreground = isDarkMode ? colors.whiteLabel : colors.dark;

  return {
    foreground,
    green: colors.green,
    purple: colors.purple,
    clearBlue: colors.clearBlue,
  };
};

function MintToastContent({ toast }: MintToastContentProps) {
  const colors = useToastColors();

  const icon = (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: colors.purple,
        shadowColor: colors.purple,
        shadowRadius: 12,
        shadowOpacity: 1,
        shadowOffset: { height: 4, width: 0 },
      }}
    >
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.purple,
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
          style={{ fontSize: 12, fontFamily: fonts.family.SFProRounded, color: colors.foreground, fontWeight: '800' }}
        >
          ✨
        </Text>
      </View>
    </View>
  );

  const title = toast.status === 'minting' ? 'Minting...' : 'Minted';
  const subtitle = toast.name;

  return <ToastContent icon={icon} title={title} subtitle={subtitle} />;
}
