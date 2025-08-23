import { AnimatedSwapCoinIcon } from '@/__swaps__/screens/Swap/components/AnimatedSwapCoinIcon';
import { BalanceBadge } from '@/__swaps__/screens/Swap/components/BalanceBadge';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { SwapActionButton } from '@/__swaps__/screens/Swap/components/SwapActionButton';
import { INPUT_INNER_WIDTH, INPUT_PADDING } from '@/__swaps__/screens/Swap/constants';
import { getInputAsset } from '@/__swaps__/screens/Swap/navigateToSwaps';
import { ExtendedAnimatedAssetWithColors, ParsedSearchAsset } from '@/__swaps__/types/assets';
import { addCommasToNumber, clamp, parseAssetAndExtend, stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { ButtonPressAnimation } from '@/components/animations';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import ContactAvatar from '@/components/contacts/ContactAvatar';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import Page from '@/components/layout/Page';
import { Navbar } from '@/components/navbar/Navbar';
import { AnimatedText, Box, Column, Columns, Separator, Stack, Text, TextIcon, useColorMode } from '@/design-system';
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
import * as i18n from '@/languages';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/Routes';
import { divWorklet, mulWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { ChainId } from '@/state/backendNetworks/types';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { CrosschainQuote, QuoteError, getCrosschainQuote } from '@rainbow-me/swaps';
import React, { memo, useCallback, useEffect } from 'react';
import Animated, { SharedValue, interpolate, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { FOOTER_HEIGHT, SLIDER_WITH_LABELS_HEIGHT } from './constants';

const NO_BALANCE_LABEL = i18n.t(i18n.l.swap.no_balance);

const enum NavigationSteps {
  INPUT_ELEMENT_FOCUSED = 0,
  TOKEN_LIST_FOCUSED = 1,
  SHOW_GAS = 3,
  SHOW_REVIEW = 4,
  SHOW_SETTINGS = 5,
}

type InputMethod = 'slider' | 'inputAmount' | 'inputNativeValue';

// Deposit Input Component
const DepositInputSection = ({
  asset,
  formattedInputAmount,
  formattedInputNativeValue,
  inputMethod,
  changeInputMethod,
  onPressInput,
  onSelectAsset,
}: {
  asset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  formattedInputAmount: SharedValue<string>;
  formattedInputNativeValue: SharedValue<string>;
  inputMethod: SharedValue<InputMethod>;
  changeInputMethod: (inputMethod: InputMethod) => void;
  onPressInput: () => void;
  onSelectAsset?: (asset: ParsedSearchAsset | null) => void;
}) => {
  const { isDarkMode } = useColorMode();
  const inputProgress = useSharedValue(NavigationSteps.INPUT_ELEMENT_FOCUSED);
  const selectedInputChainId = useSharedValue<ChainId | undefined>(undefined);

  const balanceLabel = useDerivedValue(() => {
    const assetValue = asset.value;
    if (!assetValue) return NO_BALANCE_LABEL;
    const hasBalance = Number(assetValue.balance?.amount) > 0;
    return hasBalance ? assetValue.balance?.display || NO_BALANCE_LABEL : NO_BALANCE_LABEL;
  });

  const assetSymbol = useDerivedValue(() => {
    return asset.value?.symbol || 'ETH';
  });

  const primaryFormattedInput = useDerivedValue(() => {
    if (inputMethod.value === 'inputAmount') {
      return formattedInputNativeValue.value;
    }
    return formattedInputAmount.value;
  });

  const secondaryFormattedInput = useDerivedValue(() => {
    if (inputMethod.value === 'inputAmount') {
      return formattedInputAmount.value;
    }
    return formattedInputNativeValue.value;
  });

  const receiveFormattedInput = useDerivedValue(() => {
    // TODO: Get real value here
    return '~' + formattedInputNativeValue.value + ' USDC';
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

  return (
    <PerpsInputContainer asset={asset} progress={inputProgress}>
      <Box testID={'swap-asset-input'} as={Animated.View} style={inputStyle} flexGrow={1} gap={20}>
        <Columns alignHorizontal="justify" alignVertical="center">
          <Column width="content">
            <Box paddingRight="10px">
              <AnimatedSwapCoinIcon asset={asset} size={40} />
            </Box>
          </Column>
          <Column>
            <Stack space="12px" alignHorizontal="left">
              <AnimatedText
                selector={() => {
                  'worklet';
                  return asset.value?.name;
                }}
                size="17pt"
                weight="bold"
                color="label"
              >
                {asset}
              </AnimatedText>
              <BalanceBadge label={balanceLabel} />
            </Stack>
          </Column>
          <Column width="content">
            <SwapActionButton
              asset={asset}
              disableShadow={isDarkMode}
              hugContent
              label={assetSymbol}
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
        <Box alignItems="center" justifyContent="center" flexGrow={1}>
          <Box gap={16}>
            <GestureHandlerButton disableHaptics disableScale onPressStartWorklet={onPressInput}>
              <AnimatedText size="44pt" weight="heavy" color="label">
                {primaryFormattedInput}
              </AnimatedText>
            </GestureHandlerButton>
            <GestureHandlerButton
              disableHaptics
              disableScale
              onPressWorklet={() => {
                'worklet';
                changeInputMethod(inputMethod.value === 'inputAmount' ? 'inputNativeValue' : 'inputAmount');
              }}
            >
              <Box gap={6} flexDirection="row" alignItems="center" justifyContent="center">
                <AnimatedText size="17pt" weight="bold" color="labelTertiary">
                  {secondaryFormattedInput}
                </AnimatedText>
                <TextIcon color="labelSecondary" size="13pt" weight="bold">
                  {'􀄬'}
                </TextIcon>
              </Box>
            </GestureHandlerButton>
          </Box>
        </Box>
        <Separator direction="horizontal" color="separatorSecondary" />
        <Box flexDirection="row" alignItems="center" justifyContent="center">
          {/* TODO: ICON + INTL */}
          <Text size="15pt" weight="bold" color="labelQuaternary">
            Receive{' '}
          </Text>
          <AnimatedText size="15pt" weight="bold" color="labelTertiary">
            {receiveFormattedInput}
          </AnimatedText>
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
            onSelectAsset?.(token);
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
  const inputMethod = useSharedValue<'slider' | 'inputAmount' | 'inputNativeValue'>('inputNativeValue');
  const sliderPercentage = useSharedValue(0.25); // Default to 25%
  const activeFieldId = useSharedValue<string>('inputNativeValue');
  const isFetching = useSharedValue(false);
  const quote = useSharedValue<CrosschainQuote | QuoteError | null>(null);
  const sliderPressProgress = useSharedValue(SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT);

  const highestValueNativeAsset = useUserAssetsStore(state => state.getHighestValueNativeAsset());
  const selectedAsset = useSharedValue<ExtendedAnimatedAssetWithColors | null>(getInputAsset(null));

  useEffect(() => {
    if (selectedAsset.value || !highestValueNativeAsset) return;
    selectedAsset.value = parseAssetAndExtend({ asset: highestValueNativeAsset });
  }, [highestValueNativeAsset, selectedAsset]);

  const fields = useSharedValue<Record<string, NumberPadField>>({
    inputAmount: {
      id: 'inputAmount',
      value: '0',
      maxDecimals: 18,
      allowDecimals: true,
    },
    inputNativeValue: {
      id: 'inputNativeValue',
      value: '0',
      maxDecimals: 2,
      allowDecimals: true,
    },
  });

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
      const asset = selectedAsset.value;
      if (!asset) return;

      const nativePrice = asset.price?.value || 0;

      if (fieldId === 'inputAmount') {
        const amount = Number(newValue);
        const nativeValue = mulWorklet(amount, nativePrice);

        fields.modify(current => ({
          ...current,
          inputNativeValue: {
            ...current.inputNativeValue,
            value: toFixedWorklet(nativeValue, 2),
          },
        }));

        // inputMethod.value = 'inputAmount';

        // Update slider position
        const balanceAmount = asset.balance?.amount || '0';
        const maxAmount = typeof balanceAmount === 'string' ? Number(balanceAmount) : balanceAmount;
        if (maxAmount > 0) {
          const percentage = Number(divWorklet(amount, maxAmount));
          sliderPercentage.value = clamp(percentage, 0, 1);
        }
      } else if (fieldId === 'inputNativeValue') {
        const nativeValue = Number(newValue);
        const amount = nativePrice > 0 ? divWorklet(nativeValue, nativePrice) : 0;

        fields.modify(current => ({
          ...current,
          inputAmount: {
            ...current.inputAmount,
            value: toFixedWorklet(amount, 6),
          },
        }));

        // inputMethod.value = 'inputNativeValue';

        // Update slider position
        const balanceAmount = asset.balance?.amount || '0';
        const maxAmount = typeof balanceAmount === 'string' ? Number(balanceAmount) : balanceAmount;
        if (maxAmount > 0) {
          const percentage = Number(divWorklet(amount, maxAmount));
          sliderPercentage.value = clamp(percentage, 0, 1);
        }
      }
    },
    [fields, inputMethod, selectedAsset, sliderPercentage]
  );

  const handlePercentageChange = useCallback(() => {}, []);

  // Fetch quote
  const fetchQuote = useCallback(async () => {
    const amount = fields.value.inputAmount?.value;
    if (!amount || amount === '0' || !selectedAsset.value) return;

    isFetching.value = true;
    try {
      const amountInWei = mulWorklet(Number(amount), 1e18).toString();
      const quoteResult = await getCrosschainQuote({
        chainId: selectedAsset.value.chainId,
        toChainId: HYPERCORE_PSEUDO_CHAIN_ID,
        sellTokenAddress: selectedAsset.value.address,
        buyTokenAddress: HYPERLIQUID_USDC_ADDRESS,
        sellAmount: amountInWei,
        fromAddress: accountAddress || '',
        slippage: 1,
        currency: 'USD',
      });
      quote.value = quoteResult;
    } catch (error) {
      console.error('Quote fetch error:', error);
    } finally {
      isFetching.value = false;
    }
  }, [accountAddress, fields, isFetching, quote, selectedAsset]);

  const formattedValues = useDerivedValue(() => {
    return {
      inputAmount: formattedInputAmount.value,
      inputNativeValue: formattedInputNativeValue.value,
    } as Record<string, string>;
  });

  const depositButtonText = useDerivedValue(() => {
    const value = formattedInputNativeValue.value.replace('$', '');
    return isFetching.value ? 'Fetching...' : `Deposit $${value}`;
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
          formattedInputAmount={formattedInputAmount}
          formattedInputNativeValue={formattedInputNativeValue}
          onPressInput={() => {
            'worklet';
            activeFieldId.value = 'inputAmount';
          }}
          changeInputMethod={newInputMethod => {
            'worklet';
            inputMethod.value = newInputMethod;
            activeFieldId.value =
              newInputMethod === 'inputAmount' || newInputMethod === 'inputNativeValue' ? newInputMethod : 'inputNativeValue';
          }}
          inputMethod={inputMethod}
          onSelectAsset={asset => {
            if (!asset) return;
            const extendedAsset = parseAssetAndExtend({ asset, insertUserAssetBalance: true });
            selectedAsset.value = extendedAsset;
          }}
        />
      </Box>
      <SliderWithLabels
        sliderXPosition={sliderPercentage}
        sliderPressProgress={sliderPressProgress}
        width={SLIDER_WIDTH}
        containerStyle={{ height: SLIDER_WITH_LABELS_HEIGHT, marginHorizontal: 20, justifyContent: 'center' }}
        onPercentageChange={handlePercentageChange}
        // TODO: INTL
        labels={{ title: 'Depositing' }}
        icon={<AnimatedSwapCoinIcon asset={selectedAsset} size={16} showBadge={false} />}
      />
      <NumberPad
        activeFieldId={activeFieldId}
        fields={fields}
        formattedValues={formattedValues}
        onValueChange={handleNumberPadChange}
        onFieldChange={fieldId => {
          'worklet';
          activeFieldId.value = fieldId as string;
        }}
        stripFormatting={stripNonDecimalNumbers}
      />
      <Box width="full" paddingHorizontal="20px" paddingTop="16px" height={{ custom: FOOTER_HEIGHT }}>
        <ButtonPressAnimation onPress={fetchQuote} scaleTo={0.97}>
          <Box alignItems="center" backgroundColor="accent" borderRadius={99} height="56px" justifyContent="center" width="full">
            <AnimatedText color="label" size="20pt" weight="heavy">
              {depositButtonText}
            </AnimatedText>
          </Box>
        </ButtonPressAnimation>
      </Box>
    </Box>
  );
});
