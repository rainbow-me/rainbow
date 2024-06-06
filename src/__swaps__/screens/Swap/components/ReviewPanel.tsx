import * as i18n from '@/languages';
import React, { useCallback } from 'react';

import { ReviewGasButton } from '@/__swaps__/screens/Swap/components/GasButton';
import { ChainId, ChainNameDisplay } from '@/__swaps__/types/chains';
import { AnimatedText, Bleed, Box, Inline, Separator, Stack, Text, globalColors, useColorMode } from '@/design-system';
import { StyleSheet, View } from 'react-native';

import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { fadeConfig } from '../constants';
import { NavigationSteps, useSwapContext } from '../providers/swap-provider';
import { AnimatedSwitch } from './AnimatedSwitch';

import { useAccountSettings } from '@/hooks';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';

import { AnimatedChainImage } from '@/__swaps__/screens/Swap/components/AnimatedChainImage';
import { GestureHandlerV1Button } from '@/__swaps__/screens/Swap/components/GestureHandlerV1Button';
import { useNativeAssetForChain } from '@/__swaps__/screens/Swap/hooks/useNativeAssetForChain';
import { useEstimatedTime } from '@/__swaps__/utils/meteorology';
import { convertRawAmountToBalance, convertRawAmountToNativeDisplay, handleSignificantDecimals, multiply } from '@/__swaps__/utils/numbers';
import { swapsStore, useSwapsStore } from '@/state/swaps/swapsStore';
import { useSelectedGas, useSelectedGasSpeed } from '../hooks/useSelectedGas';
import { EstimatedSwapGasFee } from './EstimatedSwapGasFee';
import { ButtonPressAnimation } from '@/components/animations';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { ethereumUtils } from '@/utils';
import { getNativeAssetForNetwork } from '@/utils/ethereumUtils';
import { getNetworkObj } from '@/networks';
import { chainNameFromChainId } from '@/__swaps__/utils/chains';

const UNKNOWN_LABEL = i18n.t(i18n.l.swap.unknown);
const REVIEW_LABEL = i18n.t(i18n.l.expanded_state.swap_details.review);
const NETWORK_LABEL = i18n.t(i18n.l.settings.network);
const MINIMUM_RECEIVED_LABEL = i18n.t(i18n.l.expanded_state.swap_details.minimum_received);
const RAINBOW_FEE_LABEL = i18n.t(i18n.l.expanded_state.swap_details.rainbow_fee);
const FLASHBOTS_PROTECTION_LABEL = i18n.t(i18n.l.swap.flashbots_protection);
const MAX_SLIPPAGE_LABEL = i18n.t(i18n.l.exchange.slippage_tolerance);
const ESTIMATED_NETWORK_FEE_LABEL = i18n.t(i18n.l.gas.network_fee);

const RainbowFee = () => {
  const { nativeCurrency } = useAccountSettings();
  const { isDarkMode } = useColorMode();
  const { isFetching, isQuoteStale, quote, internalSelectedInputAsset } = useSwapContext();

  const { nativeAsset } = useNativeAssetForChain({ inputAsset: internalSelectedInputAsset });

  const index = useSharedValue(0);
  const rainbowFee = useSharedValue<string[]>([UNKNOWN_LABEL, UNKNOWN_LABEL]);

  const feeToDisplay = useDerivedValue(() => {
    return rainbowFee.value[index.value];
  });

  const swapIndex = () => {
    'worklet';
    index.value = 1 - index.value;
  };

  const calculateRainbowFeeFromQuoteData = useCallback(
    (quote: Quote | CrosschainQuote) => {
      const feePercentage = convertRawAmountToBalance(quote.feePercentageBasisPoints, {
        decimals: 18,
      }).amount;

      const feeInEth = convertRawAmountToNativeDisplay(
        quote.feeInEth.toString(),
        nativeAsset?.value?.decimals || 18,
        nativeAsset?.value?.price?.value || '0',
        nativeCurrency
      ).display;

      rainbowFee.value = [feeInEth, `${handleSignificantDecimals(multiply(feePercentage, 100), 2)}%`];
    },
    [nativeAsset?.value?.decimals, nativeAsset?.value?.price?.value, nativeCurrency, rainbowFee]
  );

  useAnimatedReaction(
    () => ({ isFetching: isFetching.value, isQuoteStale: isQuoteStale.value, quote: quote.value }),
    current => {
      if (!current.isQuoteStale && !current.isFetching && current.quote && !(current.quote as QuoteError)?.error) {
        runOnJS(calculateRainbowFeeFromQuoteData)(current.quote as Quote | CrosschainQuote);
      }
    }
  );

  return (
    <GestureHandlerV1Button onPressWorklet={swapIndex}>
      <AnimatedText align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy">
        {feeToDisplay}
      </AnimatedText>
    </GestureHandlerV1Button>
  );
};

function EstimatedGasFee() {
  const chainId = useSwapsStore(s => s.inputAsset?.chainId || ChainId.mainnet);
  const gasSettings = useSelectedGas(chainId);

  return <EstimatedSwapGasFee gasSettings={gasSettings} align="left" color="label" size="15pt" weight="heavy" />;
}

function EstimatedArrivalTime() {
  const chainId = useSwapsStore(s => s.inputAsset?.chainId || ChainId.mainnet);
  const speed = useSelectedGasSpeed(chainId);
  const { data: estimatedTime } = useEstimatedTime({ chainId, speed });
  if (!estimatedTime) return null;
  return (
    <Text align="right" color={'labelTertiary'} size="15pt" weight="bold">
      {estimatedTime}
    </Text>
  );
}

function FlashbotsToggle() {
  const { SwapSettings } = useSwapContext();

  const inputAssetChainId = swapsStore(state => state.inputAsset?.chainId) ?? ChainId.mainnet;
  const isFlashbotsEnabledForNetwork = getNetworkObj(ethereumUtils.getNetworkFromChainId(inputAssetChainId)).features.flashbots;
  const flashbotsToggleValue = useDerivedValue(() => isFlashbotsEnabledForNetwork && SwapSettings.flashbots.value);

  return (
    <AnimatedSwitch
      onToggle={SwapSettings.onToggleFlashbots}
      disabled={!isFlashbotsEnabledForNetwork}
      value={flashbotsToggleValue}
      activeLabel={i18n.t(i18n.l.expanded_state.swap.on)}
      inactiveLabel={i18n.t(i18n.l.expanded_state.swap.off)}
    />
  );
}

export function ReviewPanel() {
  const { navigate } = useNavigation();
  const { isDarkMode } = useColorMode();
  const { configProgress, SwapSettings, SwapInputController, internalSelectedInputAsset, internalSelectedOutputAsset } = useSwapContext();

  const unknown = i18n.t(i18n.l.swap.unknown);

  const chainName = useDerivedValue(() => ChainNameDisplay[internalSelectedOutputAsset.value?.chainId ?? ChainId.mainnet]);

  const minimumReceived = useDerivedValue(() => {
    if (!SwapInputController.formattedOutputAmount.value || !internalSelectedOutputAsset.value?.symbol) {
      return unknown;
    }

    return `${SwapInputController.formattedOutputAmount.value} ${internalSelectedOutputAsset.value.symbol}`;
  });

  const handleDecrementSlippage = () => {
    'worklet';
    SwapSettings.onUpdateSlippage('minus');
  };

  const handleIncrementSlippage = () => {
    'worklet';
    SwapSettings.onUpdateSlippage('plus');
  };

  const openFlashbotsExplainer = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      type: 'flashbots',
    });
  }, [navigate]);

  const openSlippageExplainer = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      type: 'slippage',
    });
  }, [navigate]);

  const openGasExplainer = useCallback(async () => {
    const nativeAsset = await getNativeAssetForNetwork(
      ethereumUtils.getNetworkFromChainId(swapsStore.getState().inputAsset?.chainId ?? ChainId.mainnet)
    );

    navigate(Routes.EXPLAIN_SHEET, {
      network: chainNameFromChainId(swapsStore.getState().inputAsset?.chainId ?? ChainId.mainnet),
      type: 'gas',
      nativeAsset,
    });
  }, [navigate]);

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
          {REVIEW_LABEL}
        </Text>

        <Stack width="full" space="24px" alignHorizontal="stretch">
          <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
            <Inline horizontalSpace="12px">
              <Text color="labelTertiary" weight="bold" size="icon 13px">
                􀤆
              </Text>
              <Text color="labelTertiary" weight="semibold" size="15pt">
                {NETWORK_LABEL}
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
              >
                {chainName}
              </AnimatedText>
            </Inline>
          </Inline>

          <Inline wrap={false} horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
            <Inline wrap={false} horizontalSpace="12px">
              <Text color="labelTertiary" weight="bold" size="icon 13px">
                􀄩
              </Text>
              <Text color="labelTertiary" weight="semibold" size="15pt">
                {MINIMUM_RECEIVED_LABEL}
              </Text>
            </Inline>

            <Inline horizontalSpace="6px">
              <AnimatedText align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy">
                {minimumReceived}
              </AnimatedText>
            </Inline>
          </Inline>

          <Inline wrap={false} horizontalSpace="10px" alignHorizontal="justify">
            <Inline wrap={false} horizontalSpace="12px">
              <Text color="labelTertiary" weight="bold" size="icon 13px">
                􀘾
              </Text>
              <Bleed horizontal="3px">
                <Text color="labelTertiary" weight="semibold" size="15pt">
                  {RAINBOW_FEE_LABEL}
                </Text>
              </Bleed>
            </Inline>

            <Inline wrap={false} horizontalSpace="6px">
              <RainbowFee />
            </Inline>
          </Inline>

          <Separator color="separatorSecondary" />

          <Inline wrap={false} horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
            <Inline wrap={false} horizontalSpace="12px">
              <Text color="labelTertiary" weight="bold" size="icon 13px">
                􀋦
              </Text>
              <ButtonPressAnimation onPress={openFlashbotsExplainer}>
                <Inline wrap={false} horizontalSpace="4px">
                  <Text color="labelTertiary" weight="semibold" size="15pt">
                    {FLASHBOTS_PROTECTION_LABEL}
                  </Text>
                  <Text color="labelTertiary" size="13pt" weight="bold">
                    􀅴
                  </Text>
                </Inline>
              </ButtonPressAnimation>
            </Inline>

            <FlashbotsToggle />
          </Inline>

          <Inline wrap={false} horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
            <Inline wrap={false} alignHorizontal="left" horizontalSpace="12px">
              <Text color="labelTertiary" weight="bold" size="icon 13px">
                􀘩
              </Text>
              <ButtonPressAnimation onPress={openSlippageExplainer}>
                <Inline horizontalSpace="4px">
                  <Text color="labelTertiary" weight="semibold" size="15pt">
                    {MAX_SLIPPAGE_LABEL}
                  </Text>
                  <Text color="labelTertiary" size="13pt" weight="bold">
                    􀅴
                  </Text>
                </Inline>
              </ButtonPressAnimation>
            </Inline>

            <Inline wrap={false} horizontalSpace="8px" alignVertical="center">
              <GestureHandlerV1Button onPressWorklet={handleDecrementSlippage}>
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
              </GestureHandlerV1Button>

              <Inline space="2px">
                <AnimatedText align="right" style={{ minWidth: 26 }} size="15pt" weight="bold" color="labelSecondary">
                  {SwapSettings.slippage}
                </AnimatedText>
                <Text size="15pt" weight="bold" color="labelSecondary">
                  %
                </Text>
              </Inline>

              <GestureHandlerV1Button onPressWorklet={handleIncrementSlippage}>
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
              </GestureHandlerV1Button>
            </Inline>
          </Inline>

          <Separator color="separatorSecondary" />

          <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
            <ButtonPressAnimation onPress={openGasExplainer}>
              <Stack space="8px">
                <Inline alignVertical="center" horizontalSpace="6px">
                  <View style={sx.gasContainer}>
                    <AnimatedChainImage showMainnetBadge asset={internalSelectedInputAsset} size={16} />
                  </View>
                  <Inline horizontalSpace="4px">
                    <EstimatedGasFee />
                    <EstimatedArrivalTime />
                  </Inline>
                </Inline>

                <Inline wrap={false} alignHorizontal="left" alignVertical="bottom" horizontalSpace="4px">
                  <Text color="labelTertiary" size="13pt" weight="bold">
                    {ESTIMATED_NETWORK_FEE_LABEL}
                  </Text>
                  <Text color="labelTertiary" size="icon 13px" weight="bold">
                    􀅴
                  </Text>
                </Inline>
              </Stack>
            </ButtonPressAnimation>

            <Inline alignVertical="center" horizontalSpace="8px">
              <ReviewGasButton />
            </Inline>
          </Inline>
        </Stack>
      </Stack>
    </Box>
  );
}

const sx = StyleSheet.create({
  gasContainer: {
    top: 0,
    height: 16,
    width: 16,
    left: 8,
    overflow: 'visible',
  },
  networkContainer: {
    top: 2,
    height: 12,
    width: 6,
  },
});
