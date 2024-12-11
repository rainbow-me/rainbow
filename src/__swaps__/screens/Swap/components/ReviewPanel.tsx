import { AnimatedChainImage } from '@/__swaps__/screens/Swap/components/AnimatedChainImage';
import { ReviewGasButton } from '@/__swaps__/screens/Swap/components/GasButton';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { useEstimatedTime } from '@/__swaps__/utils/meteorology';
import { convertRawAmountToBalance, convertRawAmountToBalanceWorklet, handleSignificantDecimals, multiply } from '@/helpers/utilities';
import { opacity } from '@/__swaps__/utils/swaps';
import { ButtonPressAnimation } from '@/components/animations';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import {
  AnimatedText,
  Bleed,
  Box,
  Column,
  Columns,
  Inline,
  Separator,
  Stack,
  Text,
  TextIcon,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { swapsStore, useSwapsStore } from '@/state/swaps/swapsStore';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { REVIEW_SHEET_ROW_HEIGHT, THICK_BORDER_WIDTH } from '../constants';
import { useSelectedGasSpeed } from '../hooks/useSelectedGas';
import { NavigationSteps, useSwapContext } from '../providers/swap-provider';
import { EstimatedSwapGasFee, EstimatedSwapGasFeeSlot } from './EstimatedSwapGasFee';
import { UnmountOnAnimatedReaction } from './UnmountOnAnimatedReaction';
import { getChainsLabelWorklet, useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';

const UNKNOWN_LABEL = i18n.t(i18n.l.swap.unknown);
const REVIEW_LABEL = i18n.t(i18n.l.expanded_state.swap_details.review);
const NETWORK_LABEL = i18n.t(i18n.l.settings.network);
const MINIMUM_RECEIVED_LABEL = i18n.t(i18n.l.expanded_state.swap_details_v2.minimum_received);
const MAXIMUM_SOLD_LABEL = i18n.t(i18n.l.expanded_state.swap_details_v2.maximum_sold);
const RAINBOW_FEE_LABEL = i18n.t(i18n.l.expanded_state.swap_details_v2.rainbow_fee);
const MAX_SLIPPAGE_LABEL = i18n.t(i18n.l.exchange.slippage_tolerance);
const ESTIMATED_NETWORK_FEE_LABEL = i18n.t(i18n.l.gas.network_fee);

const RainbowFee = () => {
  const { isDarkMode } = useColorMode();
  const { isFetching, isQuoteStale, quote } = useSwapContext();

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

      const { display: feeDisplay } = convertRawAmountToBalance(quote.fee.toString(), {
        decimals: quote?.feeTokenAsset?.decimals || 18,
        symbol: quote?.feeTokenAsset?.symbol || 'ETH',
      });

      rainbowFee.value = [feeDisplay, `${handleSignificantDecimals(multiply(feePercentage, 100), 2)}%`];
    },
    [rainbowFee]
  );

  useAnimatedReaction(
    () => ({ isFetching: isFetching.value, isQuoteStale: isQuoteStale.value, quote: quote.value }),
    current => {
      if (!current.isQuoteStale && !current.isFetching && current.quote && !(current.quote as QuoteError)?.error) {
        runOnJS(calculateRainbowFeeFromQuoteData)(current.quote as Quote | CrosschainQuote);
      }
    },
    []
  );

  return (
    <Bleed space="12px">
      <GestureHandlerButton onPressWorklet={swapIndex}>
        <Box padding="12px">
          <AnimatedText align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="bold">
            {feeToDisplay}
          </AnimatedText>
        </Box>
      </GestureHandlerButton>
    </Bleed>
  );
};

function EstimatedGasFee() {
  return <EstimatedSwapGasFee align="left" color="label" size="15pt" weight="heavy" />;
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

export const SlippageRow = () => {
  const { navigate } = useNavigation();
  const { SwapSettings } = useSwapContext();

  const labelTertiary = useForegroundColor('labelTertiary');
  const separator = useForegroundColor('separator');

  const handleDecrementSlippage = () => {
    'worklet';
    SwapSettings.onUpdateSlippage('minus');
  };

  const handleIncrementSlippage = () => {
    'worklet';
    SwapSettings.onUpdateSlippage('plus');
  };

  const openSlippageExplainer = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      type: 'slippage',
    });
  }, [navigate]);

  return (
    <Box height={{ custom: REVIEW_SHEET_ROW_HEIGHT }} justifyContent="center">
      <Inline wrap={false} horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
        <Inline wrap={false} alignHorizontal="left" horizontalSpace="12px" alignVertical="center">
          <TextIcon color="labelTertiary" height={9} size="icon 13px" weight="bold" width={16}>
            􀘩
          </TextIcon>
          <Inline horizontalSpace="4px" alignVertical="center">
            <Text color="labelTertiary" weight="semibold" size="15pt">
              {MAX_SLIPPAGE_LABEL}
            </Text>
            <Bleed space="12px">
              <ButtonPressAnimation onPress={openSlippageExplainer} scaleTo={0.8}>
                <Text
                  align="center"
                  color={{ custom: opacity(labelTertiary, 0.24) }}
                  size="icon 13px"
                  style={{ padding: 12, top: 0.5 }}
                  weight="semibold"
                >
                  􀅴
                </Text>
              </ButtonPressAnimation>
            </Bleed>
          </Inline>
        </Inline>

        <Box alignItems="center" flexDirection="row">
          <Bleed horizontal="12px" vertical="8px">
            <GestureHandlerButton onPressWorklet={handleDecrementSlippage}>
              <Box paddingHorizontal="12px" paddingVertical="8px">
                <Box
                  style={{
                    alignItems: 'center',
                    borderColor: opacity(separator, 0.06),
                    borderWidth: 1,
                    justifyContent: 'center',
                  }}
                  height={{ custom: 16 }}
                  width={{ custom: 20 }}
                  borderRadius={8}
                  background="fillSecondary"
                >
                  <Text weight="black" size="icon 10px" color="labelTertiary" align="center">
                    􀅽
                  </Text>
                </Box>
              </Box>
            </GestureHandlerButton>
          </Bleed>

          <Box
            alignItems="center"
            flexDirection="row"
            gap={1}
            justifyContent="center"
            paddingHorizontal="8px"
            style={{ minWidth: 60, pointerEvents: 'none', zIndex: -1 }}
          >
            <AnimatedText align="center" color="labelSecondary" size="15pt" weight="bold">
              {SwapSettings.slippage}
            </AnimatedText>
            <Text align="center" color="labelSecondary" size="15pt" weight="bold">
              %
            </Text>
          </Box>

          <Bleed horizontal="12px" vertical="8px">
            <GestureHandlerButton onPressWorklet={handleIncrementSlippage}>
              <Box paddingHorizontal="12px" paddingVertical="8px">
                <Box
                  style={{
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: opacity(separator, 0.06),
                    justifyContent: 'center',
                  }}
                  height={{ custom: 16 }}
                  width={{ custom: 20 }}
                  borderRadius={8}
                  background="fillSecondary"
                >
                  <Text weight="black" size="icon 10px" color="labelTertiary" align="center">
                    􀅼
                  </Text>
                </Box>
              </Box>
            </GestureHandlerButton>
          </Bleed>
        </Box>
      </Inline>
    </Box>
  );
};

export function ReviewPanel() {
  const { navigate } = useNavigation();
  const { isDarkMode } = useColorMode();
  const backendNetworks = useBackendNetworksStore(state => state.backendNetworksSharedValue);
  const { configProgress, lastTypedInput, internalSelectedInputAsset, internalSelectedOutputAsset, quote } = useSwapContext();

  const labelTertiary = useForegroundColor('labelTertiary');
  const separator = useForegroundColor('separator');

  const unknown = i18n.t(i18n.l.swap.unknown);

  const chainName = useDerivedValue(
    () => getChainsLabelWorklet(backendNetworks)[internalSelectedInputAsset.value?.chainId ?? ChainId.mainnet]
  );

  const minReceivedOrMaxSoldLabel = useDerivedValue(() => {
    const isInputBasedTrade = lastTypedInput.value === 'inputAmount' || lastTypedInput.value === 'inputNativeValue';
    return isInputBasedTrade ? MINIMUM_RECEIVED_LABEL : MAXIMUM_SOLD_LABEL;
  });

  const minReceivedOrMaxSoldValue = useDerivedValue(() => {
    const isInputBasedTrade = lastTypedInput.value === 'inputAmount' || lastTypedInput.value === 'inputNativeValue';
    if (!quote.value || (quote.value as QuoteError)?.error) {
      return unknown;
    }

    const validQuote = quote.value as Quote;

    if (isInputBasedTrade && internalSelectedOutputAsset.value) {
      const minReceived = validQuote.buyAmountDisplayMinimum || validQuote.buyAmountMinusFees;
      const { display: minReceivedDisplay } = convertRawAmountToBalanceWorklet(minReceived.toString(), internalSelectedOutputAsset.value);
      return minReceivedDisplay;
    } else if (!isInputBasedTrade && internalSelectedInputAsset.value) {
      const maxSold = validQuote.sellAmountDisplay || validQuote.sellAmountMinusFees;
      const { display: maxSoldDisplay } = convertRawAmountToBalanceWorklet(maxSold.toString(), internalSelectedInputAsset.value);
      return maxSoldDisplay;
    }

    return unknown;
  });

  const openGasExplainer = useCallback(async () => {
    const chainsNativeAsset = useBackendNetworksStore.getState().getChainsNativeAsset();
    const nativeAsset = chainsNativeAsset[swapsStore.getState().inputAsset?.chainId ?? ChainId.mainnet];
    navigate(Routes.EXPLAIN_SHEET, {
      chainId: swapsStore.getState().inputAsset?.chainId ?? ChainId.mainnet,
      type: 'gas',
      nativeAsset,
    });
  }, [navigate]);

  const styles = useAnimatedStyle(() => {
    return {
      display: configProgress.value !== NavigationSteps.SHOW_REVIEW ? 'none' : 'flex',
      pointerEvents: configProgress.value !== NavigationSteps.SHOW_REVIEW ? 'none' : 'auto',
      opacity:
        configProgress.value === NavigationSteps.SHOW_REVIEW
          ? withDelay(120, withSpring(1, SPRING_CONFIGS.springConfig))
          : withSpring(0, SPRING_CONFIGS.springConfig),
    };
  });

  return (
    <Box as={Animated.View} paddingHorizontal="12px" zIndex={12} style={[styles, { flex: 1 }]} testID="review-panel" width="full">
      <Stack alignHorizontal="center" space="24px">
        <Text align="center" weight="heavy" color="label" size="20pt" style={{ paddingBottom: 4 }}>
          {REVIEW_LABEL}
        </Text>

        <Box gap={24} justifyContent="space-between" width="full">
          <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
            <Inline horizontalSpace="12px" alignVertical="center">
              <TextIcon color="labelTertiary" height={9} size="icon 13px" weight="bold" width={16}>
                􀤆
              </TextIcon>
              <Text color="labelTertiary" weight="semibold" size="15pt">
                {NETWORK_LABEL}
              </Text>
            </Inline>

            <Inline alignVertical="center" horizontalSpace="6px" wrap={false}>
              <View style={sx.chainBadgeContainer}>
                <AnimatedChainImage showMainnetBadge assetType="input" size={16} />
              </View>
              <AnimatedText
                align="right"
                color={isDarkMode ? 'labelSecondary' : 'label'}
                size="15pt"
                weight="bold"
                style={{ textTransform: 'capitalize' }}
              >
                {chainName}
              </AnimatedText>
            </Inline>
          </Inline>

          <Columns space="10px" alignVertical="center" alignHorizontal="justify">
            <Column width="content">
              <Box alignItems="center" flexDirection="row" gap={12}>
                <TextIcon color="labelTertiary" height={9} size="icon 13px" weight="bold" width={16}>
                  􀄩
                </TextIcon>
                <AnimatedText color="labelTertiary" weight="semibold" size="15pt">
                  {minReceivedOrMaxSoldLabel}
                </AnimatedText>
              </Box>
            </Column>

            <Column>
              <AnimatedText align="right" color={isDarkMode ? 'labelSecondary' : 'label'} numberOfLines={1} size="15pt" weight="bold">
                {minReceivedOrMaxSoldValue}
              </AnimatedText>
            </Column>
          </Columns>

          <Columns space="10px" alignVertical="center" alignHorizontal="justify">
            <Column width="content">
              <Box alignItems="center" flexDirection="row" gap={12}>
                <TextIcon color="labelTertiary" height={9} size="icon 13px" weight="bold" width={16}>
                  􀘾
                </TextIcon>
                <Text color="labelTertiary" weight="semibold" size="15pt">
                  {RAINBOW_FEE_LABEL}
                </Text>
              </Box>
            </Column>

            <Column width="content">
              <RainbowFee />
            </Column>
          </Columns>

          <Separator color={{ custom: opacity(separator, 0.03) }} thickness={THICK_BORDER_WIDTH} />

          <SlippageRow />

          <Separator color={{ custom: opacity(separator, 0.03) }} thickness={THICK_BORDER_WIDTH} />

          <Inline horizontalSpace="10px" alignVertical="center" alignHorizontal="justify">
            <ButtonPressAnimation onPress={openGasExplainer} scaleTo={0.925}>
              <Stack space="10px">
                <Inline alignVertical="center" horizontalSpace="6px" wrap={false}>
                  <View style={sx.chainBadgeContainer}>
                    <AnimatedChainImage showMainnetBadge assetType="input" size={16} />
                  </View>
                  <UnmountOnAnimatedReaction
                    isMountedWorklet={() => {
                      'worklet';
                      // only mounted when review panel is visible
                      return configProgress.value === NavigationSteps.SHOW_REVIEW;
                    }}
                    placeholder={
                      <Inline horizontalSpace="4px">
                        <EstimatedSwapGasFeeSlot text="Loading…" align="left" color="label" size="15pt" weight="heavy" />
                        {null}
                      </Inline>
                    }
                  >
                    <Inline horizontalSpace="4px">
                      <EstimatedGasFee />
                      <EstimatedArrivalTime />
                    </Inline>
                  </UnmountOnAnimatedReaction>
                </Inline>

                <Inline wrap={false} alignHorizontal="left" alignVertical="center" horizontalSpace="4px">
                  <Text color="labelTertiary" size="13pt" weight="bold">
                    {ESTIMATED_NETWORK_FEE_LABEL}
                  </Text>
                  <Text align="center" color={{ custom: opacity(labelTertiary, 0.24) }} size="icon 13px" weight="semibold">
                    􀅴
                  </Text>
                </Inline>
              </Stack>
            </ButtonPressAnimation>

            <Inline alignVertical="center" horizontalSpace="8px">
              <ReviewGasButton />
            </Inline>
          </Inline>
        </Box>
      </Stack>
    </Box>
  );
}

const sx = StyleSheet.create({
  chainBadgeContainer: {
    alignItems: 'center',
    height: 8,
    left: 8,
    justifyContent: 'center',
    top: 4,
    width: 16,
  },
});
