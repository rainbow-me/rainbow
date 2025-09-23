import { BalanceBadge } from '@/__swaps__/screens/Swap/components/BalanceBadge';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { SwapActionButton } from '@/__swaps__/screens/Swap/components/SwapActionButton';
import { INPUT_INNER_WIDTH, INPUT_PADDING, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { getGasSettings, getGasSettingsBySpeed } from '@/__swaps__/screens/Swap/hooks/useSelectedGas';
import { useSwapEstimatedGasLimit } from '@/__swaps__/screens/Swap/hooks/useSwapEstimatedGasLimit';
import { calculateGasFeeWorklet } from '@/__swaps__/screens/Swap/providers/SyncSwapStateAndSharedValues';
import { ExtendedAnimatedAssetWithColors, ParsedAsset, ParsedSearchAsset } from '@/__swaps__/types/assets';
import { GasSpeed } from '@/__swaps__/types/gas';
import { getInputValuesForSliderPositionWorklet } from '@/__swaps__/utils/flipAssets';
import { useMeteorologySuggestions } from '@/__swaps__/utils/meteorology';
import {
  addCommasToNumber,
  clamp,
  getColorValueForThemeWorklet,
  parseAssetAndExtend,
  stripNonDecimalNumbers,
} from '@/__swaps__/utils/swaps';
import { trackSwapEvent } from '@/__swaps__/utils/trackSwapEvent';
import { analytics } from '@/analytics';
import { AccountImage } from '@/components/AccountImage';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import Page from '@/components/layout/Page';
import { Navbar } from '@/components/navbar/Navbar';
import { AnimatedText, Box, Column, Columns, Separator, Stack, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities';
import { InputValueCaret } from '@/features/perps/components/InputValueCaret';
import { NumberPad } from '@/features/perps/components/NumberPad/NumberPad';
import { NumberPadField } from '@/features/perps/components/NumberPad/NumberPadKey';
import { PerpsSwapButton } from '@/features/perps/components/PerpsSwapButton';
import { PerpsTextSkeleton } from '@/features/perps/components/PerpsTextSkeleton';
import { SheetHandle } from '@/features/perps/components/SheetHandle';
import { SliderWithLabels } from '@/features/perps/components/Slider';
import { PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT, USDC_ASSET } from '@/features/perps/constants';
import { PerpsAccentColorContextProvider } from '@/features/perps/context/PerpsAccentColorContext';
import { isNativeAsset } from '@/handlers/assets';
import { LedgerSigner } from '@/handlers/LedgerSigner';
import { getProvider } from '@/handlers/web3';
import { convertRawAmountToDecimalFormat, handleSignificantDecimalsWorklet } from '@/helpers/utilities';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { loadWallet } from '@/model/wallet';
import { Navigation } from '@/navigation';
import { walletExecuteRap } from '@/raps/execute';
import { RapSwapActionParameters } from '@/raps/references';
import { divWorklet, powWorklet, subWorklet, sumWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import { GasButton } from '@/screens/token-launcher/components/gas/GasButton';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { ChainId } from '@/state/backendNetworks/types';
import { getNextNonce } from '@/state/nonces';
import { performanceTracking, Screens, TimeToSignOperation } from '@/state/performance/performance';
import { CrosschainQuote, QuoteError } from '@rainbow-me/swaps';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { FOOTER_HEIGHT, SLIDER_WIDTH, SLIDER_WITH_LABELS_HEIGHT } from './constants';
import { PerpsAssetCoinIcon } from './PerpsAssetCoinIcon';
import { PerpsInputContainer } from './PerpsInputContainer';
import { PerpsTokenList } from './PerpsTokenList';
import { usePerpsDepositQuote } from './usePerpsDepositQuote';
import { ImgixImage } from '@/components/images';

const enum NavigationSteps {
  INPUT_ELEMENT_FOCUSED = 0,
  TOKEN_LIST_FOCUSED = 1,
  SHOW_GAS = 3,
  SHOW_REVIEW = 4,
  SHOW_SETTINGS = 5,
}

type InputMethod = 'inputAmount' | 'inputNativeValue';

// Deposit Input Component
const DepositInputSection = memo(function DepositInputSection({
  asset,
  quote,
  formattedInputAmount,
  formattedInputNativeValue,
  inputMethod,
  changeInputMethod,
  onSelectAsset,
}: {
  asset: ExtendedAnimatedAssetWithColors | null;
  quote: CrosschainQuote | QuoteError | null;
  formattedInputAmount: SharedValue<string>;
  formattedInputNativeValue: SharedValue<string>;
  inputMethod: SharedValue<InputMethod>;
  changeInputMethod: (inputMethod: InputMethod) => void;
  onSelectAsset: (asset: ParsedSearchAsset | null) => void;
}) {
  const noBalanceLabel = i18n.t(i18n.l.perps.deposit.no_balance);
  const { isDarkMode } = useColorMode();
  const inputProgress = useSharedValue(NavigationSteps.INPUT_ELEMENT_FOCUSED);
  const [selectedInputChainId, setSelectedInputChainId] = useState<ChainId | undefined>(undefined);

  const balanceLabel = useDerivedValue(() => {
    if (!asset) return noBalanceLabel;
    const hasBalance = Number(asset.balance?.amount) > 0;
    return hasBalance ? asset.balance?.display || noBalanceLabel : noBalanceLabel;
  });

  const sharedAsset = useDerivedValue(() => asset);

  const primaryFormattedInput = useDerivedValue(() => {
    if (inputMethod.value === 'inputAmount') {
      return formattedInputAmount.value;
    }
    return formattedInputNativeValue.value;
  });

  const secondaryFormattedInput = useDerivedValue(() => {
    if (inputMethod.value === 'inputAmount') {
      return formattedInputNativeValue.value;
    }
    return formattedInputAmount.value;
  });

  const inputTokenListStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(inputProgress.value, [0, 1], [0, 1], 'clamp'), TIMING_CONFIGS.fadeConfig),
      pointerEvents: inputProgress.value === 0 ? 'none' : 'auto',
    };
  });

  const inputStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(inputProgress.value, [0, 1], [1, 0], 'clamp'), TIMING_CONFIGS.fadeConfig),
      pointerEvents: inputProgress.value === 0 ? 'auto' : 'none',
    };
  });

  const secondaryInputIconStyle = useAnimatedStyle(() => {
    return {
      display: inputMethod.value === 'inputNativeValue' ? 'flex' : 'none',
    };
  });

  const formattedOutputAmount = useMemo(() => {
    if (quote == null || 'error' in quote) {
      return null;
    }
    const outputAsset = quote.buyTokenAsset;
    return `~${Number(
      convertRawAmountToDecimalFormat(
        quote.buyAmount.toString(),
        outputAsset?.networks[outputAsset.chainId]?.decimals ?? outputAsset?.decimals ?? 18
      )
    ).toFixed(2)} ${USDC_ASSET.symbol}`;
  }, [quote]);

  const assetColor = getColorValueForThemeWorklet(asset?.highContrastColor, isDarkMode);

  return (
    <PerpsInputContainer asset={asset} progress={inputProgress}>
      <Box as={Animated.View} style={inputStyle} flexGrow={1} gap={20}>
        <Columns alignHorizontal="justify" alignVertical="center">
          <Column width="content">
            <Box paddingRight="10px">
              <PerpsAssetCoinIcon asset={asset} size={40} />
            </Box>
          </Column>
          <Column>
            <Stack space="12px" alignHorizontal="left">
              <Text size="17pt" weight="bold" color={{ custom: assetColor }}>
                {asset?.name}
              </Text>
              <BalanceBadge label={balanceLabel} />
            </Stack>
          </Column>
          {asset != null && (
            <Column width="content">
              <SwapActionButton
                asset={sharedAsset}
                disableShadow={isDarkMode}
                hugContent
                label={asset?.symbol || ''}
                onPressWorklet={() => {
                  'worklet';
                  inputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
                }}
                rightIcon={'􀆏'}
                style={{ marginLeft: 20 }}
                small
              />
            </Column>
          )}
        </Columns>
        <Separator color="separatorTertiary" thickness={1} />
        <Box alignItems="center" justifyContent="center" flexGrow={1} gap={16} style={{ opacity: asset == null ? 0.3 : 1 }}>
          <Box gap={2} flexDirection="row" alignItems="center">
            <AnimatedText size="44pt" weight="heavy" color={{ custom: assetColor }} tabularNumbers numberOfLines={1} ellipsizeMode="middle">
              {primaryFormattedInput}
            </AnimatedText>
            {asset != null && <InputValueCaret color={assetColor} value={primaryFormattedInput} />}
          </Box>
          <GestureHandlerButton
            disableHaptics
            disableScale
            onPressWorklet={() => {
              'worklet';
              changeInputMethod(inputMethod.value === 'inputAmount' ? 'inputNativeValue' : 'inputAmount');
            }}
            disabled={asset == null}
          >
            <Box gap={6} flexDirection="row" alignItems="center" justifyContent="center">
              <Animated.View style={secondaryInputIconStyle}>
                <PerpsAssetCoinIcon asset={asset} size={16} showBadge={false} />
              </Animated.View>
              <AnimatedText size="17pt" weight="bold" color="labelSecondary" tabularNumbers numberOfLines={1} ellipsizeMode="middle">
                {secondaryFormattedInput}
              </AnimatedText>
              <TextIcon color={{ custom: assetColor }} size="13pt" weight="bold">
                {'􀄬'}
              </TextIcon>
            </Box>
          </GestureHandlerButton>
        </Box>
        {asset != null && (
          <>
            <Separator direction="horizontal" color="separatorSecondary" />
            {quote != null && 'error' in quote ? (
              <Box flexDirection="row" alignItems="center" justifyContent="center" height={18}>
                <Text size="15pt" weight="bold" color="labelTertiary">
                  {i18n.t(i18n.l.perps.deposit.quote_error)}
                </Text>
              </Box>
            ) : (
              <Box flexDirection="row" alignItems="center" justifyContent="center" height={18}>
                <ImgixImage
                  enableFasterImage
                  size={14}
                  source={{ uri: USDC_ASSET.icon_url }}
                  style={{ height: 14, marginRight: 6, width: 14 }}
                />
                <Text size="15pt" weight="bold" color="labelQuaternary">
                  {i18n.t(i18n.l.perps.deposit.receive)}{' '}
                </Text>
                {formattedOutputAmount == null ? (
                  <PerpsTextSkeleton width={90} height={15} />
                ) : (
                  <Text size="15pt" weight="bold" color="labelTertiary" tabularNumbers>
                    {formattedOutputAmount}
                  </Text>
                )}
              </Box>
            )}
          </>
        )}
      </Box>
      <Box
        as={Animated.View}
        paddingTop={{ custom: INPUT_PADDING }}
        paddingBottom={{ custom: 14.5 }}
        position="absolute"
        style={inputTokenListStyle}
        width={{ custom: INPUT_INNER_WIDTH }}
      >
        <PerpsTokenList
          selectedChainId={selectedInputChainId}
          onSelectChain={chainId => {
            setSelectedInputChainId(chainId);
          }}
          onSelectToken={token => {
            inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
            onSelectAsset(token);
          }}
        />
      </Box>
    </PerpsInputContainer>
  );
});

export const PerpsDepositScreen = memo(function PerpsDepositScreen() {
  const { isDarkMode } = useColorMode();
  const separatorSecondary = useForegroundColor('separatorSecondary');
  // State for input values
  const inputMethod = useSharedValue<InputMethod>('inputNativeValue');
  const sliderXPosition = useSharedValue(SLIDER_WIDTH * 0.25); // Default to 25% of slider width

  const highestValueNativeAsset = useUserAssetsStore(state => state.getHighestValueNativeAsset());

  const initialAsset = highestValueNativeAsset
    ? parseAssetAndExtend({ asset: highestValueNativeAsset, insertUserAssetBalance: true })
    : null;
  const [selectedAsset, setSelectedAsset] = useState<ExtendedAnimatedAssetWithColors | null>(initialAsset);
  const [gasSpeed, setGasSpeed] = useState(GasSpeed.FAST);
  const [loading, setLoading] = useState(false);

  const fieldsValueForAsset = (
    asset: ExtendedAnimatedAssetWithColors | null,
    percentage: number,
    maxSwappableAmount: string | undefined
  ): Record<string, NumberPadField> => {
    'worklet';
    const decimals = asset?.decimals || 18;

    const { inputAmount, inputNativeValue } = getInputValuesForSliderPositionWorklet({
      selectedInputAsset: asset != null ? { ...asset, maxSwappableAmount: maxSwappableAmount || '0' } : null,
      percentageToSwap: percentage,
      sliderXPosition: percentage * SLIDER_WIDTH,
    });

    return {
      inputAmount: {
        id: 'inputAmount',
        value: inputAmount,
        maxDecimals: decimals,
        allowDecimals: true,
      },
      inputNativeValue: {
        id: 'inputNativeValue',
        value: toFixedWorklet(inputNativeValue, 2),
        maxDecimals: 2,
        allowDecimals: true,
      },
    };
  };

  const fields = useSharedValue<Record<string, NumberPadField>>(fieldsValueForAsset(initialAsset, 0.25, initialAsset?.balance.amount));

  const [quote, fetchQuote] = usePerpsDepositQuote(selectedAsset, fields);
  const hasQuoteError = quote != null && 'error' in quote;
  const chainId = selectedAsset?.chainId ?? ChainId.mainnet;
  const gasLimit = useSwapEstimatedGasLimit({
    quote,
    assetToSell: selectedAsset,
    chainId,
    usePlaceholderData: false,
  });
  const { data: gasSuggestions, isLoading: isGasSuggestionsLoading } = useMeteorologySuggestions({
    chainId,
    enabled: true,
  });
  const maxSwappableAmount = useMemo(() => {
    const gasSettings = getGasSettings(gasSpeed, chainId);
    const gasFee = gasSettings != null && gasLimit != null ? calculateGasFeeWorklet(gasSettings, gasLimit) : null;
    return selectedAsset?.balance.amount != null && gasFee != null && isNativeAsset(selectedAsset.address, selectedAsset.chainId)
      ? subWorklet(selectedAsset?.balance.amount, divWorklet(gasFee, powWorklet(10, selectedAsset.decimals)))
      : selectedAsset?.balance.amount;
  }, [chainId, gasLimit, gasSpeed, selectedAsset]);

  const sliderColors = {
    activeLeft: 'rgba(100, 117, 133, 0.90)',
    inactiveLeft: 'rgba(100, 117, 133, 0.90)',
    activeRight: separatorSecondary,
    inactiveRight: separatorSecondary,
  };

  // Formatted values
  const formattedInputAmount = useDerivedValue(() => {
    const value = fields.value.inputAmount.value;
    if (value === '0' || value === '') return '0';
    return addCommasToNumber(value, '0');
  });

  const formattedInputNativeValue = useDerivedValue(() => {
    const value = fields.value.inputNativeValue?.value || '0';
    if (value === '0' || value === '') return '$0';
    const formatted = addCommasToNumber(value, '0');
    return `$${formatted}`;
  });

  const handleNumberPadChange = useCallback(
    (fieldId: string, newValue: string | number) => {
      'worklet';
      const asset = selectedAsset;
      if (!asset) return;

      const nativePrice = asset.price?.value || 0;

      let amount = 0;
      if (fieldId === 'inputAmount') {
        amount = Number(newValue);
        const nativeValue = amount * nativePrice;

        fields.modify(current => ({
          ...current,
          inputNativeValue: {
            ...current.inputNativeValue,
            value: toFixedWorklet(nativeValue, 2),
          },
        }));
      } else if (fieldId === 'inputNativeValue') {
        const nativeValue = Number(newValue);
        amount = nativePrice > 0 ? nativeValue / nativePrice : 0;

        fields.modify(current => ({
          ...current,
          inputAmount: {
            ...current.inputAmount,
            value: handleSignificantDecimalsWorklet(amount, asset.decimals),
          },
        }));
      }

      // Update slider position
      const maxAmount = Number(maxSwappableAmount || '0');
      const percentage = maxAmount > 0 ? Number(divWorklet(amount, maxAmount)) : 0;
      sliderXPosition.value = withSpring(clamp(percentage * SLIDER_WIDTH, 0, SLIDER_WIDTH), SPRING_CONFIGS.snappySpringConfig);
    },
    [fields, maxSwappableAmount, selectedAsset, sliderXPosition]
  );

  const handlePercentageChange = useCallback(
    (percentage: number) => {
      'worklet';

      fields.value = fieldsValueForAsset(selectedAsset, percentage, maxSwappableAmount);
    },
    [fields, selectedAsset, maxSwappableAmount]
  );

  const handleGestureUpdate = useCallback(
    (percentage: number) => {
      'worklet';

      handlePercentageChange(percentage);
    },
    [handlePercentageChange]
  );

  useAnimatedReaction(
    () => fields.value.inputAmount.value,
    () => {
      runOnJS(fetchQuote)();
    }
  );

  const handleSwap = useCallback(async () => {
    if (quote == null || 'error' in quote || selectedAsset == null || loading || !gasSuggestions) return;

    setLoading(true);

    const type = 'crosschainSwap' as const;
    const parameters: Omit<RapSwapActionParameters<typeof type>, 'gasParams' | 'gasFeeParamsBySpeed' | 'selectedGasFee'> = {
      sellAmount: quote.sellAmount?.toString(),
      buyAmount: quote.buyAmount?.toString(),
      chainId: selectedAsset.chainId,
      assetToSell: selectedAsset,
      assetToBuy: USDC_ASSET as unknown as ParsedAsset,
      quote,
    };

    try {
      const provider = getProvider({ chainId: selectedAsset.chainId });

      const wallet = await performanceTracking.getState().executeFn({
        fn: loadWallet,
        screen: Screens.PERPS_DEPOSIT,
        operation: TimeToSignOperation.KeychainRead,
      })({
        address: quote.from,
        showErrorIfNotLoaded: false,
        provider,
        timeTracking: {
          screen: Screens.PERPS_DEPOSIT,
          operation: TimeToSignOperation.Authentication,
        },
      });
      const isHardwareWallet = wallet instanceof LedgerSigner;

      if (!wallet) {
        triggerHaptics('notificationError');
        return;
      }

      const gasFeeParamsBySpeed = getGasSettingsBySpeed(selectedAsset.chainId);
      let gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts;

      const selectedGas = gasSuggestions[gasSpeed as keyof typeof gasSuggestions];

      if (selectedGas.isEIP1559) {
        gasParams = {
          maxFeePerGas: sumWorklet(selectedGas.maxBaseFee, selectedGas.maxPriorityFee),
          maxPriorityFeePerGas: selectedGas.maxPriorityFee,
        };
      } else {
        gasParams = { gasPrice: selectedGas.gasPrice };
      }

      const nonce = await getNextNonce({ address: quote.from, chainId: selectedAsset.chainId });

      const { errorMessage } = await performanceTracking.getState().executeFn({
        fn: walletExecuteRap,
        screen: Screens.PERPS_DEPOSIT,
        operation: TimeToSignOperation.SignTransaction,
      })(wallet, type, {
        ...parameters,
        nonce,
        chainId: selectedAsset.chainId,
        gasParams,
        gasFeeParamsBySpeed,
      });

      if (errorMessage) {
        trackSwapEvent(analytics.event.swapsFailed, {
          errorMessage,
          isHardwareWallet,
          parameters,
          type,
        });

        if (errorMessage !== 'handled') {
          logger.error(new RainbowError(`[getNonceAndPerformSwap]: Error executing swap: ${errorMessage}`));
          const extractedError = errorMessage.split('[')[0];
          Alert.alert(i18n.t(i18n.l.swap.error_executing_swap), extractedError);
          return;
        }
      }

      performanceTracking.getState().executeFn({
        fn: () => {
          Navigation.goBack();
        },
        screen: Screens.PERPS_DEPOSIT,
        operation: TimeToSignOperation.SheetDismissal,
        endOfOperation: true,
      })();

      trackSwapEvent(analytics.event.swapsSubmitted, {
        isHardwareWallet,
        parameters,
        type,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generic error while trying to swap';
      logger.error(new RainbowError(`[getNonceAndPerformSwap]: ${message}`), {
        data: { error, parameters, type },
      });
    } finally {
      setLoading(false);
    }
  }, [gasSpeed, gasSuggestions, loading, quote, selectedAsset]);

  const handleSelectAsset = useCallback(
    (asset: ParsedSearchAsset | null) => {
      if (!asset) return;
      const extendedAsset = parseAssetAndExtend({ asset, insertUserAssetBalance: true });
      setSelectedAsset(extendedAsset);

      fields.value = fieldsValueForAsset(extendedAsset, 0.25, extendedAsset?.balance.amount);
      sliderXPosition.value = withSpring(clamp(0.25 * SLIDER_WIDTH, 0, SLIDER_WIDTH), SPRING_CONFIGS.snappySpringConfig);
    },
    [fields, sliderXPosition]
  );

  const formattedValues = useDerivedValue(() => {
    return {
      inputAmount: formattedInputAmount.value,
      inputNativeValue: formattedInputNativeValue.value,
    } as Record<string, string>;
  });

  const inputAmountErrorShared = useDerivedValue(() => {
    const balance = Number(maxSwappableAmount || '0');
    const amountNumber = Number(fields.value.inputAmount.value || '0');
    if (amountNumber === 0) return 'zero';
    if (amountNumber > balance) return 'overBalance';
    return null;
  });
  // Sync this JS state with input amount error reanimated value.
  const [inputAmountError, setInputAmountError] = useState<'overBalance' | 'zero' | null>(null);
  useAnimatedReaction(
    () => inputAmountErrorShared.value,
    newError => {
      runOnJS(setInputAmountError)(newError);
    }
  );

  const getConfirmButtonLabel = () => {
    if (inputAmountError === 'zero') {
      return i18n.t(i18n.l.perps.deposit.confirm_button_zero_text);
    }
    if (inputAmountError === 'overBalance') {
      return i18n.t(i18n.l.perps.deposit.confirm_button_over_balance_text);
    }
    if (hasQuoteError) {
      return i18n.t(i18n.l.perps.deposit.confirm_button_error_text);
    }
    if (loading) {
      return i18n.t(i18n.l.perps.deposit.confirm_button_loading_text);
    }
    return i18n.t(i18n.l.perps.deposit.confirm_button_text);
  };

  const handleChangeInputMethod = useCallback(
    (newInputMethod: InputMethod) => {
      'worklet';
      inputMethod.value = newInputMethod;
    },
    [inputMethod]
  );

  return (
    <PerpsAccentColorContextProvider>
      <Box
        as={Page}
        backgroundColor={isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT}
        flex={1}
        height="full"
        testID="perps-deposit-screen"
        width="full"
      >
        <SheetHandle extraPaddingTop={6} />
        <Navbar hasStatusBarInset leftComponent={<AccountImage />} title={i18n.t(i18n.l.perps.deposit.title)} />
        <Box alignItems="center" paddingTop="20px">
          <DepositInputSection
            asset={selectedAsset}
            quote={quote}
            formattedInputAmount={formattedInputAmount}
            formattedInputNativeValue={formattedInputNativeValue}
            changeInputMethod={handleChangeInputMethod}
            inputMethod={inputMethod}
            onSelectAsset={handleSelectAsset}
          />
        </Box>
        <SliderWithLabels
          sliderXPosition={sliderXPosition}
          width={SLIDER_WIDTH}
          containerStyle={{ height: SLIDER_WITH_LABELS_HEIGHT, marginHorizontal: 20, justifyContent: 'center' }}
          onPercentageChange={handlePercentageChange}
          onPercentageUpdate={handleGestureUpdate}
          showMaxButton={true}
          showPercentage={true}
          labels={{
            title: i18n.t(i18n.l.perps.deposit.slider_label),
            disabledText: i18n.t(i18n.l.perps.deposit.no_balance),
          }}
          icon={<PerpsAssetCoinIcon asset={selectedAsset} size={16} showBadge={false} />}
          colors={sliderColors}
        />
        <NumberPad
          activeFieldId={inputMethod as SharedValue<string>}
          fields={fields}
          formattedValues={formattedValues}
          onValueChange={handleNumberPadChange}
          stripFormatting={stripNonDecimalNumbers}
        />
        <Box
          width="full"
          paddingHorizontal="20px"
          paddingTop="16px"
          height={{ custom: FOOTER_HEIGHT }}
          flexDirection="row"
          gap={20}
          alignItems="center"
        >
          <Box alignItems="flex-start" justifyContent="center">
            <GasButton
              gasSpeed={gasSpeed}
              chainId={selectedAsset?.chainId ?? ChainId.mainnet}
              onSelectGasSpeed={setGasSpeed}
              gasLimit={gasLimit}
              isFetching={quote == null || isGasSuggestionsLoading}
            />
          </Box>
          <Box height={32}>
            <Separator color={'separatorTertiary'} direction="vertical" thickness={THICK_BORDER_WIDTH} />
          </Box>
          <Box flexGrow={1}>
            <PerpsSwapButton
              label={getConfirmButtonLabel()}
              onLongPress={handleSwap}
              disabled={loading || quote == null || hasQuoteError || inputAmountError != null}
              disabledOpacity={inputAmountError != null || hasQuoteError ? 1 : undefined}
            />
          </Box>
        </Box>
      </Box>
    </PerpsAccentColorContextProvider>
  );
});
