import React, { useCallback, useState } from 'react';
import * as i18n from '@/languages';

import { AnimatedText, Box, Inline, Separator, Stack, Text, globalColors, useColorMode } from '@/design-system';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { NavigationSteps, useSwapContext } from '../providers/swap-provider';
import { fadeConfig } from '../constants';
import { ethereumUtils } from '@/utils';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ChainId } from '@/__swaps__/types/chains';
import { chainNameFromChainIdWorklet } from '@/__swaps__/utils/chains';
import { AnimatedSwitch } from './AnimatedSwitch';
import { GasButton } from '@/__swaps__/screens/Swap/components/GasButton';
import { ButtonPressAnimation } from '@/components/animations';
import { StyleSheet, View } from 'react-native';
import { AnimatedChainImage } from './AnimatedChainImage';

const SLIPPAGE_STEP = 0.5;

const RainbowFee = () => {
  const { isDarkMode } = useColorMode();

  const rainbowFee = useSharedValue(i18n.t(i18n.l.swap.unknown));

  return <AnimatedText align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy" text={rainbowFee} />;
};

export function ReviewPanel() {
  const { isDarkMode } = useColorMode();
  const { configProgress, SwapInputController, internalSelectedInputAsset, internalSelectedOutputAsset } = useSwapContext();

  const unknown = i18n.t(i18n.l.swap.unknown);

  const chainName = useDerivedValue(() =>
    internalSelectedOutputAsset.value?.chainId === ChainId.mainnet
      ? 'ethereum'
      : chainNameFromChainIdWorklet(internalSelectedOutputAsset.value?.chainId ?? ChainId.mainnet)
  );

  const slippageText = useDerivedValue(() => `1.5%`);

  const [chain, setChain] = useState(ethereumUtils.getNetworkFromChainId(internalSelectedOutputAsset.value?.chainId ?? ChainId.mainnet));

  const minimumReceived = useDerivedValue(() => {
    if (!SwapInputController.inputValues.value.outputAmount || !internalSelectedOutputAsset.value) {
      return unknown;
    }
    return `${SwapInputController.inputValues.value.outputAmount} ${internalSelectedOutputAsset.value.symbol}`;
  });

  const flashbots = useDerivedValue(() => false);

  const updateChainFromNetwork = useCallback((chainId: ChainId) => {
    setChain(ethereumUtils.getNetworkFromChainId(chainId));
  }, []);

  useAnimatedReaction(
    () => internalSelectedInputAsset.value?.chainId ?? ChainId.mainnet,
    (current, previous) => {
      if (!previous || previous !== current) {
        runOnJS(updateChainFromNetwork)(current);
      }
    }
  );

  const onSetSlippage = useCallback((operation: 'increment' | 'decrement') => {
    'worklet';
    const value = operation === 'increment' ? SLIPPAGE_STEP : -SLIPPAGE_STEP;
    // SwapInputController.slippage.value = `${Math.max(0.5, Number(SwapInputController.slippage.value) + value)}`;
  }, []);

  const onSetFlashbots = useCallback(() => {
    'worklet';
    // SwapInputController.flashbots.value = !SwapInputController.flashbots.value;
  }, []);

  // TODO: Comes from gas store
  const estimatedGasFee = useSharedValue('$2.25');
  const estimatedArrivalTime = useSharedValue('~4 sec');

  const styles = useAnimatedStyle(() => {
    return {
      display: configProgress.value !== NavigationSteps.SHOW_REVIEW ? 'none' : 'flex',
      pointerEvents: configProgress.value !== NavigationSteps.SHOW_REVIEW ? 'none' : 'auto',
      opacity: configProgress.value === NavigationSteps.SHOW_REVIEW ? withTiming(1, fadeConfig) : withTiming(0, fadeConfig),
      flex: 1,
    };
  });

  return (
    <Box as={Animated.View} zIndex={12} style={styles} testID="review-panel" width="full">
      <Stack alignHorizontal="center" space="28px">
        <Text weight="heavy" color="label" size="20pt">
          Review
        </Text>

        <Stack width="full" space="24px" alignHorizontal="stretch">
          <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
            <Inline horizontalSpace="12px">
              <Text color="labelTertiary" weight="bold" size="13pt">
                􀤆
              </Text>
              <Text color="labelTertiary" weight="semibold" size="15pt">
                Network
              </Text>
            </Inline>

            <Inline alignVertical="center" horizontalSpace="6px">
              <View style={sx.networkContainer}>
                <AnimatedChainImage showMainnetBadge asset={internalSelectedInputAsset} size={16} />
              </View>
              <AnimatedText
                align="right"
                color={isDarkMode ? 'labelSecondary' : 'label'}
                size="15pt"
                weight="heavy"
                style={{ textTransform: 'capitalize' }}
                text={chainName}
              />
            </Inline>
          </Inline>

          <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
            <Inline horizontalSpace="12px">
              <Text color="labelTertiary" weight="bold" size="13pt">
                􀄩
              </Text>
              <Text color="labelTertiary" weight="semibold" size="15pt">
                Minimum Received
              </Text>
            </Inline>

            <Inline horizontalSpace="6px">
              <AnimatedText
                align="right"
                color={isDarkMode ? 'labelSecondary' : 'label'}
                size="15pt"
                weight="heavy"
                text={minimumReceived}
              />
            </Inline>
          </Inline>

          <Inline horizontalSpace="10px" alignHorizontal="justify">
            <Inline horizontalSpace="12px">
              <Text color="labelTertiary" weight="bold" size="13pt">
                􀘾
              </Text>
              <Text color="labelTertiary" weight="semibold" size="15pt">
                Rainbow Fee
              </Text>
            </Inline>

            <Inline horizontalSpace="6px">
              <RainbowFee />
            </Inline>
          </Inline>

          <Separator color="separatorSecondary" />

          <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
            <Inline horizontalSpace="12px">
              <Text color="labelTertiary" weight="bold" size="13pt">
                􀋦
              </Text>
              <Inline horizontalSpace="4px">
                <Text color="labelTertiary" weight="semibold" size="15pt">
                  Flashbots Protection
                </Text>
                <Text color="labelTertiary" size="13pt" weight="bold">
                  􀅴
                </Text>
              </Inline>
            </Inline>

            <AnimatedSwitch onToggle={onSetFlashbots} value={flashbots} activeLabel="On" inactiveLabel="Off" />
          </Inline>

          <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
            <Inline alignHorizontal="left" horizontalSpace="12px">
              <Text color="labelTertiary" weight="bold" size="13pt">
                􀘩
              </Text>
              <Inline horizontalSpace="4px">
                <Text color="labelTertiary" weight="semibold" size="15pt">
                  Max Slippage
                </Text>
                <Text color="labelTertiary" size="13pt" weight="bold">
                  􀅴
                </Text>
              </Inline>
            </Inline>

            <Inline wrap={false} horizontalSpace="8px" alignVertical="center">
              <ButtonPressAnimation onPress={() => onSetSlippage('decrement')}>
                <Box
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: isDarkMode ? globalColors.white10 : globalColors.grey100,
                  }}
                  height={{ custom: 16 }}
                  width={{ custom: 20 }}
                  borderRadius={100}
                  background="fillSecondary" // TODO: 12% opacity
                  paddingVertical="1px (Deprecated)"
                  gap={10}
                >
                  {/* TODO: 56% opacity */}
                  <Text weight="black" size="icon 10px" color="labelTertiary">
                    􀅽
                  </Text>
                </Box>
              </ButtonPressAnimation>

              <AnimatedText size="15pt" weight="bold" color="labelSecondary" text={slippageText} />

              <ButtonPressAnimation onPress={() => onSetSlippage('increment')}>
                <Box
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: isDarkMode ? globalColors.white10 : globalColors.grey100,
                  }}
                  height={{ custom: 16 }}
                  width={{ custom: 20 }}
                  borderRadius={100}
                  background="fillSecondary" // TODO: 12% opacity
                  paddingVertical="1px (Deprecated)"
                  gap={10}
                >
                  {/* TODO: 56% opacity */}
                  <Text weight="black" size="icon 10px" color="labelTertiary">
                    􀅼
                  </Text>
                </Box>
              </ButtonPressAnimation>
            </Inline>
          </Inline>

          <Separator color="separatorSecondary" />

          <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
            <Stack space="6px">
              <Inline alignVertical="center" horizontalSpace="6px">
                <View style={sx.gasContainer}>
                  <AnimatedChainImage showMainnetBadge asset={internalSelectedInputAsset} size={16} />
                </View>
                <Inline horizontalSpace="4px">
                  <AnimatedText align="left" color={'label'} size="15pt" weight="heavy" text={estimatedGasFee} />
                  <AnimatedText align="right" color={'labelTertiary'} size="15pt" weight="bold" text={estimatedArrivalTime} />
                </Inline>
              </Inline>

              <Inline alignVertical="center" horizontalSpace="4px">
                <Text color="labelTertiary" size="13pt" weight="bold">
                  Est. Network Fee
                </Text>
                <Text color="labelTertiary" size="13pt" weight="bold">
                  􀅴
                </Text>
              </Inline>
            </Stack>

            <Inline alignVertical="center" horizontalSpace="8px">
              <GasButton isReviewing />
            </Inline>
          </Inline>
        </Stack>
      </Stack>
    </Box>
  );
}

const sx = StyleSheet.create({
  gasContainer: {
    top: 2,
    height: 12,
    width: 10,
    left: 4,
    overflow: 'visible',
  },
  networkContainer: {
    top: 2,
    height: 12,
    width: 6,
  },
});
