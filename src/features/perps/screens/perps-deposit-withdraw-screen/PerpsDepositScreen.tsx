import { BalanceBadge } from '@/__swaps__/screens/Swap/components/BalanceBadge';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { SwapActionButton } from '@/__swaps__/screens/Swap/components/SwapActionButton';
import { INPUT_INNER_WIDTH, INPUT_PADDING, USDC_ASSET } from '@/__swaps__/screens/Swap/constants';
import { useSwapEstimatedGasLimit } from '@/__swaps__/screens/Swap/hooks/useSwapEstimatedGasLimit';
import { ExtendedAnimatedAssetWithColors, ParsedSearchAsset } from '@/__swaps__/types/assets';
import { GasSpeed } from '@/__swaps__/types/gas';
import { addCommasToNumber, clamp, opacity, parseAssetAndExtend, stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { ButtonPressAnimation } from '@/components/animations';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import ContactAvatar from '@/components/contacts/ContactAvatar';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import Page from '@/components/layout/Page';
import { Navbar } from '@/components/navbar/Navbar';
import { RainbowImage } from '@/components/RainbowImage';
import Skeleton, { FakeText } from '@/components/skeleton/Skeleton';
import { AnimatedText, Box, Column, Columns, Separator, Stack, Text, TextIcon, useBackgroundColor, useColorMode } from '@/design-system';
import { InputValueCaret } from '@/features/perps/components/InputValueCaret';
import { NumberPad } from '@/features/perps/components/NumberPad/NumberPad';
import { NumberPadField } from '@/features/perps/components/NumberPad/NumberPadKey';
import { SheetHandle } from '@/features/perps/components/SheetHandle';
import { SliderWithLabels } from '@/features/perps/components/Slider';
import {
  HYPERCORE_PSEUDO_CHAIN_ID,
  HYPERLIQUID_USDC_ADDRESS,
  SLIDER_COLLAPSED_HEIGHT,
  SLIDER_HEIGHT,
  SLIDER_WIDTH,
} from '@/features/perps/constants';
import { PerpsInputContainer } from '@/features/perps/screens/perps-deposit-withdraw-screen/PerpsInputContainer';
import { PerpsTokenList } from '@/features/perps/screens/perps-deposit-withdraw-screen/PerpsTokenList';
import { convertRawAmountToDecimalFormat } from '@/helpers/utilities';
import * as i18n from '@/languages';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/Routes';
import { divWorklet, mulWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import { GasButton } from '@/screens/token-launcher/components/gas/GasButton';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { ChainId } from '@/state/backendNetworks/types';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { CrosschainQuote, getCrosschainQuote, QuoteError } from '@rainbow-me/swaps';
import React, { memo, useCallback, useMemo, useState } from 'react';
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
import { useDebouncedCallback } from 'use-debounce';
import { FOOTER_HEIGHT, SLIDER_WITH_LABELS_HEIGHT } from './constants';

const AssetCoinIcon = ({
  asset,
  size,
  showBadge,
}: {
  asset: ExtendedAnimatedAssetWithColors | null;
  size: number;
  showBadge?: boolean;
}) => {
  if (!asset) return null;
  return <RainbowCoinIcon chainId={asset.chainId} symbol={asset.symbol} icon={asset.icon_url} size={size} showBadge={showBadge} />;
};

const NO_BALANCE_LABEL = i18n.t(i18n.l.swap.no_balance);

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
  const { isDarkMode } = useColorMode();
  const inputProgress = useSharedValue(NavigationSteps.INPUT_ELEMENT_FOCUSED);
  const selectedInputChainId = useSharedValue<ChainId | undefined>(undefined);

  const balanceLabel = useDerivedValue(() => {
    if (!asset) return NO_BALANCE_LABEL;
    const hasBalance = Number(asset.balance?.amount) > 0;
    return hasBalance ? asset.balance?.display || NO_BALANCE_LABEL : NO_BALANCE_LABEL;
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

  const skeletonColor = useBackgroundColor('fillQuaternary');
  const shimmerColor = opacity(useBackgroundColor('fillSecondary'), 0.1);

  return (
    <PerpsInputContainer asset={asset} progress={inputProgress}>
      <Box testID={'swap-asset-input'} as={Animated.View} style={inputStyle} flexGrow={1} gap={20}>
        <Columns alignHorizontal="justify" alignVertical="center">
          <Column width="content">
            <Box paddingRight="10px">
              <AssetCoinIcon asset={asset} size={40} />
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
            <InputValueCaret asset={asset} value={primaryFormattedInput} />
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
                <AssetCoinIcon asset={asset} size={16} showBadge={false} />
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
          {/* TODO: INTL */}
          <Text size="15pt" weight="bold" color="labelQuaternary">
            Receive{' '}
          </Text>
          {formattedOutputAmount == null ? (
            <Box as={Animated.View} height={{ custom: 15 }} width={{ custom: 90 }}>
              <Skeleton skeletonColor={skeletonColor} shimmerColor={shimmerColor}>
                <FakeText height={15} width={90} />
              </Skeleton>
            </Box>
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
          onSelectChain={chainId => {
            selectedInputChainId.value = chainId;
          }}
          onSelectToken={token => {
            inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
            onSelectAsset(token);
          }}
          inputProgress={inputProgress}
        />
      </Box>
    </PerpsInputContainer>
  );
};

export const PerpsDepositScreen = memo(function PerpsDepositScreen() {
  const accountAddress = userAssetsStoreManager(state => state.address);
  const { accountImage, accountColor, accountSymbol } = useAccountProfileInfo();

  // State for input values
  const inputMethod = useSharedValue<InputMethod>('inputNativeValue');
  const sliderXPosition = useSharedValue(SLIDER_WIDTH * 0.25); // Default to 25% of slider width
  const formattedOutputAmount = useSharedValue<string | null>(null);
  const [quote, setQuote] = useState<CrosschainQuote | QuoteError | null>(null);
  const sliderPressProgress = useSharedValue(SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT);

  const highestValueNativeAsset = useUserAssetsStore(state => state.getHighestValueNativeAsset());

  const initialAsset = highestValueNativeAsset ? parseAssetAndExtend({ asset: highestValueNativeAsset }) : null;
  const [selectedAsset, setSelectedAsset] = useState<ExtendedAnimatedAssetWithColors | null>(initialAsset);
  const [gasSpeed, setGasSpeed] = useState(GasSpeed.FAST);
  // TODO: Is this ok?
  const gasLimit = useSwapEstimatedGasLimit({ quote, assetToSell: selectedAsset, chainId: ChainId.mainnet });

  const fieldsValueForAsset = (asset: ExtendedAnimatedAssetWithColors | null, percentage: number): Record<string, NumberPadField> => {
    'worklet';

    const maxAmount = Number(asset?.balance?.amount || '0');
    const nativePrice = asset?.price?.value || 0;
    const decimals = asset?.decimals || 18;

    const amount = maxAmount * percentage;
    const nativeValue = amount * nativePrice;

    return {
      inputAmount: {
        id: 'inputAmount',
        value: amount,
        maxDecimals: decimals,
        allowDecimals: true,
      },
      inputNativeValue: {
        id: 'inputNativeValue',
        value: toFixedWorklet(nativeValue, 2),
        maxDecimals: 2,
        allowDecimals: true,
      },
    };
  };

  const fields = useSharedValue<Record<string, NumberPadField>>(fieldsValueForAsset(initialAsset, 0.25));

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
            value: amount,
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
    ({ percentage }: { percentage: number }) => {
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
      const amountInWei = mulWorklet(Number(amount), 1e18).toString();
      const quoteResult = await getCrosschainQuote({
        chainId: selectedAsset.chainId,
        toChainId: HYPERCORE_PSEUDO_CHAIN_ID,
        sellTokenAddress: selectedAsset.address,
        buyTokenAddress: HYPERLIQUID_USDC_ADDRESS,
        sellAmount: amountInWei,
        fromAddress: accountAddress || '',
        slippage: 1,
        currency: 'USD',
      });
      setQuote(quoteResult);
    } catch (error) {
      setQuote(null);
      console.error('Quote fetch error:', error);
    }
  }, [accountAddress, fields.value.inputAmount?.value, selectedAsset]);

  const fetchQuoteDebounced = useDebouncedCallback(fetchQuote, 200, { leading: false, trailing: true });

  useAnimatedReaction(
    () => fields.value.inputAmount?.value,
    () => {
      runOnJS(fetchQuoteDebounced)();
    }
  );

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
        title={'Deposit'}
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
        sliderPressProgress={sliderPressProgress}
        width={SLIDER_WIDTH}
        containerStyle={{ height: SLIDER_WITH_LABELS_HEIGHT, marginHorizontal: 20, justifyContent: 'center' }}
        onPercentageChangeWorklet={handlePercentageChange}
        onGestureUpdateWorklet={handleGestureUpdate}
        showMaxButton={true}
        showPercentage={true}
        // TODO: INTL
        labels={{ title: 'Depositing', maxButtonText: 'Max', disabledText: NO_BALANCE_LABEL }}
        icon={<AssetCoinIcon asset={selectedAsset} size={16} showBadge={false} />}
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
          <ButtonPressAnimation onPress={fetchQuote} scaleTo={0.97}>
            <Box alignItems="center" backgroundColor="accent" borderRadius={99} height="56px" justifyContent="center" width="full">
              <Text color="label" size="20pt" weight="heavy" tabularNumbers>
                Hold to Deposit
              </Text>
            </Box>
          </ButtonPressAnimation>
        </Box>
      </Box>
    </Box>
  );
});
