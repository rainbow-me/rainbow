import React, { useCallback, useState } from 'react';
import * as i18n from '@/languages';

import { AnimatedText, Box, Inline, Separator, Stack, Text, globalColors, useColorMode } from '@/design-system';
import Animated, {
  runOnJS,
  runOnUI,
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
import { GasSpeed } from '@/__swaps__/types/gas';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { useAccountSettings } from '@/hooks';
import { useNativeAssetForChain } from '../hooks/useNativeAsset';
import { convertRawAmountToBalance, convertRawAmountToNativeDisplay, handleSignificantDecimals, multiply } from '@/__swaps__/utils/numbers';

const SLIPPAGE_STEP = 0.5;

const unknown = i18n.t(i18n.l.swap.unknown);

const RainbowFee = () => {
  const { nativeCurrency } = useAccountSettings();
  const { isDarkMode } = useColorMode();
  const { quote, internalSelectedInputAsset } = useSwapContext();

  const { nativeAsset } = useNativeAssetForChain({ inputAsset: internalSelectedInputAsset });

  const index = useSharedValue(0);
  const rainbowFee = useSharedValue<string[]>([unknown, unknown]);

  const feeToDisplay = useDerivedValue(() => {
    return rainbowFee.value[index.value];
  });

  const swapIndex = () => {
    'worklet';

    index.value = 1 - index.value;
  };

  const calculateRainbowFeeFromQuoteData = useCallback(
    (quote: Quote | CrosschainQuote) => {
      const updateRainbowFee = ({ feeInEth, feePercentage }: { feeInEth: string; feePercentage: string }) => {
        'worklet';
        rainbowFee.value = [feeInEth, feePercentage];
      };

      const feePercentage = convertRawAmountToBalance(quote.feePercentageBasisPoints, {
        decimals: 18,
      }).amount;

      const feeInEth = convertRawAmountToNativeDisplay(
        quote.feeInEth.toString(),
        nativeAsset?.value?.decimals || 18,
        nativeAsset?.value?.price?.value || '0',
        nativeCurrency
      ).display;

      runOnUI(updateRainbowFee)({
        feeInEth,
        feePercentage: `${handleSignificantDecimals(multiply(feePercentage, 100), 2)}%`,
      });
    },
    [nativeAsset?.value?.decimals, nativeAsset?.value?.price?.value, nativeCurrency, rainbowFee]
  );

  useAnimatedReaction(
    () => quote.value,
    (current, previous) => {
      if (current && previous !== current && !(current as QuoteError)?.error) {
        runOnJS(calculateRainbowFeeFromQuoteData)(current as Quote | CrosschainQuote);
      }
    }
  );

  return (
    <ButtonPressAnimation onPress={() => runOnUI(swapIndex)()}>
      <AnimatedText align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy" text={feeToDisplay} />
    </ButtonPressAnimation>
  );
};

export function ReviewPanel() {
  const { isDarkMode } = useColorMode();
  const { SwapGas, configProgress, SwapInputController, internalSelectedInputAsset, internalSelectedOutputAsset } = useSwapContext();

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
    return `${SwapInputController.formattedOutputAmount.value} ${internalSelectedOutputAsset.value.symbol}`;
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
    // SwapInputController.slippage.value = `${Math.max(0.5, Number(SwapInputController.slippage.value) + value)}`;
  }, []);

  const onSetFlashbots = useCallback(() => {
    'worklet';
    // SwapInputController.flashbots.value = !SwapInputController.flashbots.value;
  }, []);

  const selectedGasSpeedNativeValue = useDerivedValue(() => {
    if (!SwapGas.gasFeeParamsBySpeed.value) return 'Loading...';
    const option = SwapGas.selectedGasSpeed.value ?? GasSpeed.NORMAL;
    return SwapGas.gasFeeParamsBySpeed.value[option].gasFee.display;
  });

  const estimatedArrivalTime = useDerivedValue(() => {
    if (!SwapGas.gasFeeParamsBySpeed.value) return '';

    const option = SwapGas.selectedGasSpeed.value ?? GasSpeed.NORMAL;
    return SwapGas.gasFeeParamsBySpeed.value[option].estimatedTime.display;
  });

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
              <ChainImage chain={chain} size={16} />
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
                <ChainImage chain={chain} size={16} />
                <Inline horizontalSpace="4px">
                  <AnimatedText align="left" color={'label'} size="15pt" weight="heavy" text={selectedGasSpeedNativeValue} />
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
