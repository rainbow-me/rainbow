import React, { memo, useCallback, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { SharedValue, interpolate, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { AnimatedText, Box, Column, Columns, Separator, Stack, TextIcon, globalColors, useColorMode } from '@/design-system';
import { ChainId, CrosschainQuote, getCrosschainQuote, QuoteError } from '@rainbow-me/swaps';
import { HYPERCORE_PSEUDO_CHAIN_ID, HYPERLIQUID_USDC_ADDRESS } from '@/features/perps/constants';
import { BASE_INPUT_WIDTH, INPUT_INNER_WIDTH, INPUT_PADDING, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import Page from '@/components/layout/Page';
import { Navbar } from '@/components/navbar/Navbar';
import { ButtonPressAnimation } from '@/components/animations';
import { Navigation } from '@/navigation';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import Routes from '@/navigation/Routes';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import ContactAvatar from '@/components/contacts/ContactAvatar';
import { SwapInput } from '@/__swaps__/screens/Swap/components/SwapInput';
import { SwapActionButton } from '@/__swaps__/screens/Swap/components/SwapActionButton';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { BalanceBadge } from '@/__swaps__/screens/Swap/components/BalanceBadge';
import { NumberPad } from '@/features/perps/components/NumberPad/NumberPad';
import { NumberPadField } from '@/features/perps/components/NumberPad/NumberPadKey';
import { ExtendedAnimatedAssetWithColors, ParsedSearchAsset } from '@/__swaps__/types/assets';
import { parseAssetAndExtend, addCommasToNumber, clamp, stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { divWorklet, mulWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import * as i18n from '@/languages';
import ImgixImage from '@/components/images/ImgixImage';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { IS_IOS } from '@/env';
import { TokenList } from '@/__swaps__/screens/Swap/components/TokenList/TokenList';
import { TokenToSellListProps } from '@/__swaps__/screens/Swap/components/TokenList/TokenToSellList';
import { NavigationSteps } from '@/__swaps__/screens/Swap/hooks/useSwapNavigation';
import { getInputAsset } from '@/__swaps__/screens/Swap/navigateToSwaps';
import { Slider } from '@/features/perps/components/Slider';

const NO_BALANCE_LABEL = i18n.t(i18n.l.swap.no_balance);

type InputMethod = 'slider' | 'inputAmount' | 'inputNativeValue';

// Simple Coin Icon Component
const DepositCoinIcon = ({ asset, size = 36 }: { asset: SharedValue<ExtendedAnimatedAssetWithColors | null>; size?: number }) => {
  const assetValue = useDerivedValue(() => asset.value);

  return (
    <Box width={{ custom: size }} height={{ custom: size }} style={{ position: 'relative' }}>
      {assetValue.value?.icon_url && (
        <>
          <ImgixImage
            source={{ uri: assetValue.value.icon_url }}
            size={size}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
          {assetValue.value.chainId && assetValue.value.chainId !== 1 && (
            <Box position="absolute" bottom={{ custom: -4 }} right={{ custom: -4 }}>
              <ChainImage chainId={assetValue.value.chainId} size={16} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

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
  const inputProgress = useSharedValue(0);
  const outputProgress = useSharedValue(0);
  const selectedOutputChainId = useSharedValue<ChainId | undefined>(undefined);

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
    <SwapInput asset={asset} bottomInput={false} otherInputProgress={outputProgress} progress={inputProgress}>
      <Box testID={'swap-asset-input'} as={Animated.View} style={inputStyle}>
        <Stack space="16px">
          <Columns alignHorizontal="justify" alignVertical="center">
            <Column width="content">
              <Box paddingRight="10px">
                <DepositCoinIcon asset={asset} size={36} />
              </Box>
            </Column>
            <Column width="content">
              <Stack space="8px">
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
            <Column>
              <SwapActionButton
                asset={asset}
                disableShadow={isDarkMode}
                hugContent
                label={assetSymbol}
                onPressWorklet={() => {
                  'worklet';
                  // pause quote fetching
                  inputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
                }}
                rightIcon={'􀆏'}
                small
              />
            </Column>
          </Columns>
          <Separator direction="horizontal" color="separatorSecondary" />
          <Box alignItems="center" justifyContent="center" height={{ custom: 117 }}>
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
        </Stack>
      </Box>
      <Box
        as={Animated.View}
        paddingTop={{ custom: INPUT_PADDING }}
        paddingBottom={{ custom: 14.5 }}
        position="absolute"
        style={inputTokenListStyle}
        width={{ custom: INPUT_INNER_WIDTH }}
      >
        <TokenList
          handleExitSearchWorklet={() => {
            'worklet';
            inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
          }}
          handleFocusSearchWorklet={() => {
            'worklet';
            inputProgress.value = NavigationSteps.SEARCH_FOCUSED;
          }}
          output={false}
          disableSearch={true}
          tokenToSellListProps={{
            onSelectChain: chainId => {
              selectedOutputChainId.value = chainId;
            },
            onSelectToken: token => {
              inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
              onSelectAsset?.(token);
            },
            inputProgress,
            selectedOutputChainId,
          }}
        />
      </Box>
    </SwapInput>
  );
};

export const PerpsDepositScreen = memo(function PerpsDepositScreen() {
  const isDarkMode = useColorMode();
  const accountAddress = userAssetsStoreManager(state => state.address);
  const { accountImage, accountColor, accountSymbol } = useAccountProfileInfo();

  // State for input values
  const inputMethod = useSharedValue<'slider' | 'inputAmount' | 'inputNativeValue'>('inputNativeValue');
  const sliderPercentage = useSharedValue(0.25); // Default to 25%
  const activeFieldId = useSharedValue<string>('inputNativeValue');
  const isFetching = useSharedValue(false);
  const quote = useSharedValue<CrosschainQuote | QuoteError | null>(null);

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

  const outputAmount = useDerivedValue(() => {
    const q = quote.value;
    if (q && 'buyAmount' in q) {
      const amount = divWorklet(Number(q.buyAmount), 1e6); // USDC has 6 decimals
      return toFixedWorklet(amount, 2);
    }
    return '0';
  });

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
    <Box
      as={Page}
      flex={1}
      height="full"
      style={{ backgroundColor: isDarkMode ? globalColors.grey100 : '#FBFCFD' }}
      testID="perps-deposit-screen"
      width="full"
    >
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

      <Box paddingHorizontal="20px" paddingTop="12px">
        <AnimatedText align="center" size="15pt" color="labelQuaternary" weight="semibold">
          {useDerivedValue(() => `Receive ${outputAmount.value} USDC`)}
        </AnimatedText>
      </Box>

      <Box paddingTop="24px" alignItems="center">
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

      <Stack space="16px">
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
        {/* <Slider
          sliderXPosition={sliderPercentage}
          sliderPressProgress={sliderPressProgress}
          isEnabled={isEnabled}
          colors={colors}
          onPercentageChange={handlePercentageChange}
          onGestureUpdate={handleGestureUpdate}
          snapPoints={[0, 0.25, 0.5, 0.75, 1]}
          width={SLIDER_WIDTH}
          height={SLIDER_HEIGHT}
        /> */}
      </Stack>

      <Box position="absolute" bottom={{ custom: 40 }} width="full" paddingHorizontal="20px">
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

const styles = StyleSheet.create({
  staticInputContainerStyles: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 9,
  },
  staticInputStyles: {
    borderCurve: 'continuous',
    borderRadius: 30,
    borderWidth: IS_IOS ? THICK_BORDER_WIDTH : 0,
    overflow: 'hidden',
    padding: INPUT_PADDING,
    width: BASE_INPUT_WIDTH,
  },
});
