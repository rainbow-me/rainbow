import { BalanceBadge } from '@/__swaps__/screens/Swap/components/BalanceBadge';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { SwapActionButton } from '@/__swaps__/screens/Swap/components/SwapActionButton';
import { INPUT_INNER_WIDTH, INPUT_PADDING, USDC_ASSET } from '@/__swaps__/screens/Swap/constants';
import { getGasSettingsBySpeed } from '@/__swaps__/screens/Swap/hooks/useSelectedGas';
import { useSwapEstimatedGasLimit } from '@/__swaps__/screens/Swap/hooks/useSwapEstimatedGasLimit';
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
import { ButtonPressAnimation } from '@/components/animations';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import ContactAvatar from '@/components/contacts/ContactAvatar';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import Page from '@/components/layout/Page';
import { Navbar } from '@/components/navbar/Navbar';
import { RainbowImage } from '@/components/RainbowImage';
import { AnimatedText, Box, Column, Columns, Separator, Stack, Text, TextIcon, useColorMode } from '@/design-system';
import { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities';
import { InputValueCaret } from '@/features/perps/components/InputValueCaret';
import { NumberPad } from '@/features/perps/components/NumberPad/NumberPad';
import { NumberPadField } from '@/features/perps/components/NumberPad/NumberPadKey';
import { PerpsSwapButton } from '@/features/perps/components/PerpsSwapButton';
import { PerpsTextSkeleton } from '@/features/perps/components/PerpsTextSkeleton';
import { SheetHandle } from '@/features/perps/components/SheetHandle';
import { SliderWithLabels } from '@/features/perps/components/Slider';
import { HYPERCORE_PSEUDO_CHAIN_ID, HYPERLIQUID_USDC_ADDRESS } from '@/features/perps/constants';
import { PerpsInputContainer } from '@/features/perps/screens/perps-deposit-withdraw-screen/PerpsInputContainer';
import { PerpsTokenList } from '@/features/perps/screens/perps-deposit-withdraw-screen/PerpsTokenList';
import { LedgerSigner } from '@/handlers/LedgerSigner';
import { getProvider } from '@/handlers/web3';
import { convertAmountToRawAmount, convertRawAmountToDecimalFormat, handleSignificantDecimalsWorklet } from '@/helpers/utilities';
import { useAccountSettings } from '@/hooks';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { loadWallet } from '@/model/wallet';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/Routes';
import { walletExecuteRap } from '@/raps/execute';
import { RapSwapActionParameters } from '@/raps/references';
import { divWorklet, sumWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import { GasButton } from '@/screens/token-launcher/components/gas/GasButton';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { ChainId } from '@/state/backendNetworks/types';
import { getNextNonce } from '@/state/nonces';
import { performanceTracking, Screens, TimeToSignOperation } from '@/state/performance/performance';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { CrosschainQuote, getCrosschainQuote, QuoteError } from '@rainbow-me/swaps';
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
import { useDebouncedCallback } from 'use-debounce';
import { FOOTER_HEIGHT, SLIDER_WIDTH, SLIDER_WITH_LABELS_HEIGHT } from './constants';
import { PerpsAssetCoinIcon } from './PerpsAssetCoinIcon';

const enum NavigationSteps {
  INPUT_ELEMENT_FOCUSED = 0,
  TOKEN_LIST_FOCUSED = 1,
  SHOW_GAS = 3,
  SHOW_REVIEW = 4,
  SHOW_SETTINGS = 5,
}

type InputMethod = 'inputAmount' | 'inputNativeValue';

// Deposit Input Component
const DepositInputSection = ({
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
}) => {
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

  return (
    <PerpsInputContainer asset={asset} progress={inputProgress}>
      <Box testID={'swap-asset-input'} as={Animated.View} style={inputStyle} flexGrow={1} gap={20}>
        <Columns alignHorizontal="justify" alignVertical="center">
          <Column width="content">
            <Box paddingRight="10px">
              <PerpsAssetCoinIcon asset={asset} size={40} />
            </Box>
          </Column>
          <Column>
            <Stack space="12px" alignHorizontal="left">
              <Text size="17pt" weight="bold" color="label">
                {asset?.name}
              </Text>
              <BalanceBadge label={balanceLabel} />
            </Stack>
          </Column>
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
        </Columns>
        <Separator direction="horizontal" color="separatorSecondary" />
        <Box alignItems="center" justifyContent="center" flexGrow={1} gap={16}>
          <Box gap={2} flexDirection="row" alignItems="center">
            <AnimatedText size="44pt" weight="heavy" color="label" tabularNumbers numberOfLines={1} ellipsizeMode="middle">
              {primaryFormattedInput}
            </AnimatedText>
            <InputValueCaret color={getColorValueForThemeWorklet(asset?.highContrastColor, isDarkMode)} value={primaryFormattedInput} />
          </Box>
          <GestureHandlerButton
            disableHaptics
            disableScale
            onPressWorklet={() => {
              'worklet';
              changeInputMethod(inputMethod.value === 'inputAmount' ? 'inputNativeValue' : 'inputAmount');
            }}
          >
            <Box gap={6} flexDirection="row" alignItems="center" justifyContent="center">
              <Animated.View style={secondaryInputIconStyle}>
                <PerpsAssetCoinIcon asset={asset} size={16} showBadge={false} />
              </Animated.View>
              <AnimatedText size="17pt" weight="bold" color="labelTertiary" tabularNumbers numberOfLines={1} ellipsizeMode="middle">
                {secondaryFormattedInput}
              </AnimatedText>
              <TextIcon color="labelSecondary" size="13pt" weight="bold">
                {'􀄬'}
              </TextIcon>
            </Box>
          </GestureHandlerButton>
        </Box>
        <Separator direction="horizontal" color="separatorSecondary" />
        <Box flexDirection="row" alignItems="center" justifyContent="center">
          <RainbowImage
            source={{
              url: USDC_ASSET.icon_url,
            }}
            style={{ width: 14, height: 14, marginRight: 6 }}
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
};

export const PerpsDepositScreen = memo(function PerpsDepositScreen() {
  const accountAddress = userAssetsStoreManager(state => state.address);
  const { accountImage, accountColor, accountSymbol } = useAccountProfileInfo();
  const { nativeCurrency } = useAccountSettings();

  // State for input values
  const inputMethod = useSharedValue<InputMethod>('inputNativeValue');
  const sliderXPosition = useSharedValue(SLIDER_WIDTH * 0.25); // Default to 25% of slider width
  const [quote, setQuote] = useState<CrosschainQuote | QuoteError | null>(null);

  const highestValueNativeAsset = useUserAssetsStore(state => state.getHighestValueNativeAsset());

  const initialAsset = highestValueNativeAsset ? parseAssetAndExtend({ asset: highestValueNativeAsset }) : null;
  const [selectedAsset, setSelectedAsset] = useState<ExtendedAnimatedAssetWithColors | null>(initialAsset);
  const [gasSpeed, setGasSpeed] = useState(GasSpeed.FAST);
  // TODO: Is this ok?
  const gasLimit = useSwapEstimatedGasLimit({ quote, assetToSell: selectedAsset, chainId: ChainId.mainnet });
  const { data: gasSuggestions } = useMeteorologySuggestions({
    chainId: selectedAsset?.chainId ?? ChainId.mainnet,
    enabled: true,
  });
  const [loading, setLoading] = useState(false);

  const fieldsValueForAsset = (asset: ExtendedAnimatedAssetWithColors | null, percentage: number): Record<string, NumberPadField> => {
    'worklet';
    const decimals = asset?.decimals || 18;

    const { inputAmount, inputNativeValue } = getInputValuesForSliderPositionWorklet({
      selectedInputAsset: asset,
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

  const fields = useSharedValue<Record<string, NumberPadField>>(fieldsValueForAsset(initialAsset, 0.25));

  const sliderColors = {
    activeLeft: 'rgba(100, 117, 133, 0.90)',
    inactiveLeft: 'rgba(100, 117, 133, 0.90)',
    activeRight: 'rgba(244, 248, 255, 0.06)',
    inactiveRight: 'rgba(244, 248, 255, 0.06)',
  };

  // Formatted values
  const formattedInputAmount = useDerivedValue(() => {
    const value = fields.value.inputAmount?.value || '0';
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
      const maxAmount = Number(asset.balance?.amount || '0');
      const percentage = maxAmount > 0 ? Number(divWorklet(amount, maxAmount)) : 0;
      sliderXPosition.value = withSpring(clamp(percentage * SLIDER_WIDTH, 0, SLIDER_WIDTH), SPRING_CONFIGS.snappySpringConfig);
    },
    [fields, selectedAsset, sliderXPosition]
  );

  const handlePercentageChange = useCallback(
    (percentage: number) => {
      'worklet';

      fields.value = fieldsValueForAsset(selectedAsset, percentage);
    },
    [fields, selectedAsset]
  );

  const handleGestureUpdate = useCallback(
    (percentage: number) => {
      'worklet';

      handlePercentageChange(percentage);
    },
    [handlePercentageChange]
  );

  // Fetch quote
  const fetchQuote = useCallback(async () => {
    const amount = fields.value.inputAmount?.value;
    if (!amount || amount === '0' || !selectedAsset) return;
    setQuote(null);
    try {
      const quoteResult = await getCrosschainQuote({
        chainId: selectedAsset.chainId,
        toChainId: HYPERCORE_PSEUDO_CHAIN_ID,
        sellTokenAddress: selectedAsset.address,
        buyTokenAddress: HYPERLIQUID_USDC_ADDRESS,
        sellAmount: convertAmountToRawAmount(amount, selectedAsset.decimals),
        fromAddress: accountAddress || '',
        slippage: 1,
        currency: nativeCurrency,
      });
      setQuote(quoteResult);
    } catch (error) {
      setQuote(null);
      console.error('Quote fetch error:', error);
    }
  }, [accountAddress, fields.value.inputAmount?.value, nativeCurrency, selectedAsset]);

  const fetchQuoteDebounced = useDebouncedCallback(fetchQuote, 200, { leading: false, trailing: true });

  useAnimatedReaction(
    () => fields.value.inputAmount?.value,
    () => {
      runOnJS(fetchQuoteDebounced)();
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
      // TODO: Check if this works.
      assetToBuy: USDC_ASSET as unknown as ParsedAsset,
      quote,
    };

    try {
      // const NotificationManager = IS_IOS ? NativeModules.NotificationManager : null;
      // NotificationManager?.postNotification('rapInProgress');

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
        // showWalletErrorAlert();
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

      // NotificationManager?.postNotification('rapCompleted');
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

      fields.value = fieldsValueForAsset(extendedAsset, 0.25);
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

  return (
    <Box as={Page} flex={1} height="full" testID="perps-deposit-screen" width="full">
      <SheetHandle extraPaddingTop={6} />
      <Navbar
        hasStatusBarInset
        leftComponent={
          <ButtonPressAnimation onPress={() => Navigation.handleAction(Routes.CHANGE_WALLET_SHEET)} scaleTo={0.8} overflowMargin={50}>
            {accountImage ? (
              <ImageAvatar image={accountImage} size="header" />
            ) : (
              <ContactAvatar color={accountColor} size="small" value={accountSymbol} />
            )}
          </ButtonPressAnimation>
        }
        title={i18n.t(i18n.l.perps.deposit.title)}
      />
      <Box alignItems="center" paddingTop="20px">
        <DepositInputSection
          asset={selectedAsset}
          quote={quote}
          formattedInputAmount={formattedInputAmount}
          formattedInputNativeValue={formattedInputNativeValue}
          changeInputMethod={newInputMethod => {
            'worklet';
            inputMethod.value = newInputMethod;
          }}
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
      <Box width="full" paddingHorizontal="20px" paddingTop="16px" height={{ custom: FOOTER_HEIGHT }} flexDirection="row" gap={20}>
        <Box width={96} alignItems="flex-start" justifyContent="center">
          <GasButton gasSpeed={gasSpeed} chainId={ChainId.mainnet} onSelectGasSpeed={setGasSpeed} gasLimit={gasLimit} />
        </Box>
        <Box flexGrow={1}>
          <PerpsSwapButton
            label={loading ? i18n.t(i18n.l.perps.deposit.confirm_button_loading_text) : i18n.t(i18n.l.perps.deposit.confirm_button_text)}
            onLongPress={handleSwap}
            disabled={loading}
          />
        </Box>
      </Box>
    </Box>
  );
});
