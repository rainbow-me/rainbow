import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { opacity } from '@/framework/ui/utils/opacity';
import { Box, Separator, globalColors, useColorMode } from '@/design-system';
import { RNBW_REWARDS, useExperimentalFlag } from '@/config';
import { useRemoteConfig } from '@/model/remoteConfig';
import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
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
import { getIsHardwareWallet } from '@/state/wallets/walletsStore';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { logger, RainbowError } from '@/logger';
import { IS_TEST } from '@/env';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import * as i18n from '@/languages';
import { convertRawAmountToDecimalFormat, truncateToDecimalsWithThreshold } from '@/helpers/utilities';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/styles/constants';

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

  const { swipeToDismissGesture, gestureY } = useBottomPanelGestureHandler();
  const { rnbw_rewards_enabled } = useRemoteConfig('rnbw_rewards_enabled');
  const rnbwRewardsEnabled = useExperimentalFlag(RNBW_REWARDS) || rnbw_rewards_enabled;

  const isRewardEligible = useSwapsStore(state => state.rewardsEstimate?.eligible === true);
  const rewardsEstimate = useSwapsStore(state => state.rewardsEstimate);
  const showRewards = rnbwRewardsEnabled && isRewardEligible && confirmButtonProps.value.type === 'hold';

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

  const { navigate } = useNavigation();
  const handleHwConnectionAndSwap = useCallback(() => {
    try {
      if (getIsHardwareWallet() && configProgress.value === NavigationSteps.SHOW_REVIEW) {
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
  }, [configProgress.value, navigate, SwapNavigation]);

  const handleRewardsInfoPress = useCallback(() => {
    const rawTokenAmount = Number(rewardsEstimate?.rewardRnbw ?? 0);
    const decimals = rewardsEstimate?.decimals ?? 18;
    const tokenAmount = convertRawAmountToDecimalFormat(rawTokenAmount, decimals);
    const formattedTokenAmount = truncateToDecimalsWithThreshold({ value: tokenAmount, decimals: 1, threshold: '0.01' });
    navigate(Routes.RNBW_REWARDS_ESTIMATE_SHEET, {
      estimatedAmount: formattedTokenAmount,
    });
  }, [navigate, rewardsEstimate?.rewardRnbw, rewardsEstimate?.decimals]);

  return (
    <GestureDetector gesture={swipeToDismissGesture}>
      <Animated.View
        style={[
          styles.swapActionsWrapper,
          gestureHandlerStyles,
          AnimatedSwapStyles.keyboardStyle,
          AnimatedSwapStyles.swapActionWrapperStyle,
        ]}
        testID="swap-bottom-panel-wrapper"
      >
        <ReviewPanel />
        <SettingsPanel />
        <GasPanel />
        <Box
          alignItems="center"
          flexDirection="row"
          height={{ custom: 48 }}
          justifyContent="center"
          style={[{ alignSelf: 'center' }]}
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
          <Box style={{ flex: 1 }} testID="swap-bottom-action-button">
            <SwapActionButton
              asset={internalSelectedOutputAsset}
              holdProgress={holdProgress}
              icon={icon}
              iconStyle={confirmButtonIconStyle}
              label={label}
              subtitle={showRewards ? i18n.t(i18n.l.swap.actions.earning_rewards) : undefined}
              rightIcon={showRewards ? '􀅴' : undefined}
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
              onPressRightIconJS={showRewards ? handleRewardsInfoPress : undefined}
              scaleTo={0.9}
            />
          </Box>
        </Box>
      </Animated.View>
    </GestureDetector>
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
