import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { opacity } from '@/__swaps__/utils/swaps';
import { Box, Separator, globalColors, useColorMode } from '@/design-system';
import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { useBottomPanelGestureHandler } from '../hooks/useBottomPanelGestureHandler';
import { GasButton } from './GasButton';
import { GasPanel } from './GasPanel';
import { ReviewPanel } from './ReviewPanel';
import { SwapActionButton } from './SwapActionButton';
import { SettingsPanel } from './SettingsPanel';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useWallets } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { logger, RainbowError } from '@/logger';

const HOLD_TO_SWAP_DURATION_MS = 400;

export function SwapBottomPanel() {
  const { isDarkMode } = useColorMode();
  const {
    AnimatedSwapStyles,
    SwapNavigation,
    configProgress,
    confirmButtonIconStyle,
    confirmButtonProps,
    internalSelectedOutputAsset,
    quoteFetchingInterval,
  } = useSwapContext();

  const { swipeToDismissGestureHandler, gestureY } = useBottomPanelGestureHandler();

  const holdProgress = useSharedValue(0);

  const gestureHandlerStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: gestureY.value }],
    };
  });

  const gasButtonVisibilityStyle = useAnimatedStyle(() => {
    return {
      display:
        configProgress.value === NavigationSteps.SHOW_REVIEW ||
        configProgress.value === NavigationSteps.SHOW_GAS ||
        configProgress.value === NavigationSteps.SHOW_SETTINGS
          ? 'none'
          : 'flex',
    };
  });

  const icon = useDerivedValue(() => confirmButtonProps.value.icon);
  const label = useDerivedValue(() => confirmButtonProps.value.label);
  const disabled = useDerivedValue(() => confirmButtonProps.value.disabled);
  const opacity = useDerivedValue(() => confirmButtonProps.value.opacity);
  const type = useDerivedValue(() => confirmButtonProps.value.type);

  const { isHardwareWallet } = useWallets();
  const { navigate } = useNavigation();
  const handleHwConnectionAndSwap = useCallback(() => {
    try {
      if (isHardwareWallet && configProgress.value === NavigationSteps.SHOW_REVIEW) {
        navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, {
          submit: SwapNavigation.handleSwapAction,
        });
      } else {
        SwapNavigation.handleSwapAction();
      }
    } catch (e) {
      logger.error(new RainbowError('[SwapBottomPanel.tsx]: handleHwConnectionAndSwap Error: '), {
        message: (e as Error).message,
      });
    }
  }, [configProgress.value, navigate, isHardwareWallet, SwapNavigation]);

  return (
    <PanGestureHandler maxPointers={1} onGestureEvent={swipeToDismissGestureHandler}>
      <Animated.View
        style={[
          styles.swapActionsWrapper,
          gestureHandlerStyles,
          AnimatedSwapStyles.keyboardStyle,
          AnimatedSwapStyles.swapActionWrapperStyle,
        ]}
      >
        <ReviewPanel />
        <SettingsPanel />
        <GasPanel />
        <Box
          alignItems="center"
          flexDirection="row"
          height={{ custom: 48 }}
          justifyContent="center"
          style={{ alignSelf: 'center' }}
          width="full"
          zIndex={20}
        >
          <Animated.View
            style={[
              gasButtonVisibilityStyle,
              { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'center', paddingRight: 12 },
            ]}
          >
            <GasButton />
            <Box height={{ custom: 32 }}>
              <Separator color={{ custom: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR }} direction="vertical" thickness={1} />
            </Box>
          </Animated.View>
          <Box style={{ flex: 1 }}>
            <SwapActionButton
              testID="swap-bottom-action-button"
              asset={internalSelectedOutputAsset}
              holdProgress={holdProgress}
              icon={icon}
              iconStyle={confirmButtonIconStyle}
              label={label}
              longPressDuration={HOLD_TO_SWAP_DURATION_MS}
              disabled={disabled}
              onPressWorklet={() => {
                'worklet';
                if (type.value !== 'hold') {
                  runOnJS(handleHwConnectionAndSwap)();
                }
              }}
              onLongPressEndWorklet={success => {
                'worklet';
                if (!success) {
                  quoteFetchingInterval.start();
                  holdProgress.value = withSpring(0, SPRING_CONFIGS.slowSpring);
                }
              }}
              onLongPressWorklet={() => {
                'worklet';
                if (type.value === 'hold') {
                  triggerHaptics('notificationSuccess');
                  runOnJS(handleHwConnectionAndSwap)();
                }
              }}
              onPressStartWorklet={() => {
                'worklet';
                if (type.value === 'hold') {
                  quoteFetchingInterval.stop();
                  holdProgress.value = 0;
                  holdProgress.value = withTiming(
                    100,
                    { duration: HOLD_TO_SWAP_DURATION_MS, easing: Easing.inOut(Easing.sin) },
                    isFinished => {
                      if (isFinished) {
                        holdProgress.value = 0;
                      }
                    }
                  );
                }
              }}
              opacity={opacity}
              scaleTo={0.9}
            />
          </Box>
        </Box>
      </Animated.View>
    </PanGestureHandler>
  );
}

export const styles = StyleSheet.create({
  reviewViewBackground: {
    margin: 12,
    flex: 1,
  },
  reviewMainBackground: {
    borderRadius: 40,
    borderColor: opacity(globalColors.darkGrey, 0.2),
    borderCurve: 'continuous',
    borderWidth: THICK_BORDER_WIDTH,
    gap: 24,
    padding: 24,
    overflow: 'hidden',
  },
  swapActionsWrapper: {
    borderCurve: 'continuous',
    borderWidth: THICK_BORDER_WIDTH,
    overflow: 'hidden',
    paddingBottom: 16 - THICK_BORDER_WIDTH,
    position: 'absolute',
    zIndex: 15,
  },
});
