import React, { memo } from 'react';
import Animated, { SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { AnimatedTextIcon } from '@/components/AnimatedComponents/AnimatedTextIcon';
import { ImgixImage } from '@/components/images';
import { AnimatedText, Bleed, Box, Column, Columns, Separator, Stack, Text, useColorMode } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { InputValueCaret } from '@/features/perps/components/InputValueCaret';
import { PerpsTextSkeleton } from '@/features/perps/components/PerpsTextSkeleton';
import { USDC_ASSET } from '@/features/perps/constants';
import { usePerpsDepositContext } from '@/features/perps/screens/perps-deposit-withdraw-screen/PerpsDepositContext';
import { QuoteStatus } from '@/features/perps/screens/perps-deposit-withdraw-screen/types';
import * as i18n from '@/languages';
import { BalanceBadge } from '@/__swaps__/screens/Swap/components/BalanceBadge';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { SwapActionButton } from '@/__swaps__/screens/Swap/components/SwapActionButton';
import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { PerpsAssetCoinIcon } from './PerpsAssetCoinIcon';

// ============ Types ========================================================== //

type DepositAmountInputProps = {
  displayedAmount: SharedValue<string>;
  displayedNativeValue: SharedValue<string>;
  inputMethod: SharedValue<'inputAmount' | 'inputNativeValue'>;
  onChangeInputMethod: () => void;
  onSelectAsset: () => void;
};

// ============ Components ===================================================== //

export const DepositAmountInput = memo(function DepositAmountInput({
  inputMethod,
  onChangeInputMethod,
  onSelectAsset,
}: DepositAmountInputProps) {
  const { isDarkMode } = useColorMode();
  const { minifiedAsset, primaryFormattedInput, secondaryFormattedInput, useDepositStore } = usePerpsDepositContext();

  const isAssetSelected = useDepositStore(state => state.hasAsset());
  const noBalanceLabel = i18n.t(i18n.l.perps.deposit.no_balance);

  const assetSymbol = useDerivedValue(() => minifiedAsset.value?.symbol || '');
  const textColor = useDerivedValue(() =>
    minifiedAsset.value?.highContrastColor ? getColorValueForThemeWorklet(minifiedAsset.value?.highContrastColor, isDarkMode) : '#999999'
  );

  const balanceLabel = useDerivedValue(() => {
    const currentAsset = minifiedAsset.value;
    if (!currentAsset) return noBalanceLabel;
    const hasBalance = Number(currentAsset.balance?.amount) > 0;
    return hasBalance ? currentAsset.balance?.display || noBalanceLabel : noBalanceLabel;
  });

  const secondaryInputIconStyle = useAnimatedStyle(() => ({
    display: inputMethod.value === 'inputNativeValue' ? 'flex' : 'none',
  }));

  const textColorStyle = useAnimatedStyle(() => ({ color: textColor.value }));

  return (
    <Box flexGrow={1} gap={20}>
      <Columns alignHorizontal="justify" alignVertical="center">
        <Column width="content">
          <Box paddingRight="10px">
            <PerpsAssetCoinIcon size={40} />
          </Box>
        </Column>
        <Column>
          <Stack space="12px" alignHorizontal="left">
            <AnimatedText
              selector={() => {
                'worklet';
                return minifiedAsset.value?.name || '';
              }}
              size="17pt"
              style={textColorStyle}
              weight="bold"
            >
              {minifiedAsset}
            </AnimatedText>
            <BalanceBadge label={balanceLabel} />
          </Stack>
        </Column>
        {isAssetSelected && (
          <Column width="content">
            <SwapActionButton
              asset={minifiedAsset}
              disableShadow={isDarkMode}
              hugContent
              label={assetSymbol}
              onPressWorklet={onSelectAsset}
              rightIcon={'􀆏'}
              style={{ marginLeft: 20 }}
              small
            />
          </Column>
        )}
      </Columns>

      <Separator color="separatorTertiary" thickness={1} />

      <Box alignItems="center" justifyContent="center" flexGrow={1} gap={16} style={{ opacity: isAssetSelected ? 1 : 0.3 }}>
        <Box flexDirection="row" alignItems="center">
          <AnimatedText
            align="center"
            size="44pt"
            weight="heavy"
            style={[{ letterSpacing: 0.28 }, textColorStyle]}
            tabularNumbers
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {primaryFormattedInput}
          </AnimatedText>
          {isAssetSelected && <InputValueCaret color={textColor} value={primaryFormattedInput} />}
        </Box>

        <GestureHandlerButton
          disabled={!isAssetSelected}
          hapticTrigger="tap-end"
          hapticType="soft"
          hitSlop={{ bottom: 12, top: 8 }}
          onPressWorklet={onChangeInputMethod}
          scaleTo={0.88}
          style={{ minWidth: '50%', paddingHorizontal: 16 }}
        >
          <Box gap={4} flexDirection="row" alignItems="center" justifyContent="center">
            <Box as={Animated.View} paddingHorizontal="2px" style={secondaryInputIconStyle}>
              <PerpsAssetCoinIcon size={16} showBadge={false} />
            </Box>

            <AnimatedText
              align="center"
              size="17pt"
              weight="bold"
              color="labelSecondary"
              tabularNumbers
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {secondaryFormattedInput}
            </AnimatedText>

            <AnimatedTextIcon size="13pt" textStyle={textColorStyle} weight="heavy" width={20}>
              {'􀄬'}
            </AnimatedTextIcon>
          </Box>
        </GestureHandlerButton>
      </Box>

      {isAssetSelected && <QuoteOutput />}
    </Box>
  );
});

const QuoteOutput = memo(function ReceiveAmount() {
  const { useAmountToReceive } = usePerpsDepositContext();
  const { status, formattedAmount } = useAmountToReceive();
  return (
    <>
      <Separator color="separatorTertiary" thickness={1} />

      <Box alignItems="center" flexDirection="row" height={10} justifyContent="center">
        {quoteHasError(status) ? (
          <Text align="center" color={getErrorTextColor(status)} size="15pt" weight="bold">
            {getErrorLabel(status)}
          </Text>
        ) : (
          <>
            <Bleed vertical="4px">
              <ImgixImage
                enableFasterImage
                size={14}
                source={{ uri: USDC_ASSET.icon_url }}
                style={{ height: 14, marginRight: 6, width: 14 }}
              />
            </Bleed>
            <Text color="labelQuaternary" size="15pt" weight="bold">
              {i18n.t(i18n.l.perps.deposit.receive)}{' '}
            </Text>

            {status === QuoteStatus.Pending ? (
              <PerpsTextSkeleton height={15} width={90} />
            ) : (
              <Text color="labelTertiary" size="15pt" weight="bold">
                {formattedAmount}
              </Text>
            )}
          </>
        )}
      </Box>
    </>
  );
});

function getErrorLabel(status: QuoteStatus.Error | QuoteStatus.InsufficientBalance | QuoteStatus.ZeroAmountError): string {
  switch (status) {
    case QuoteStatus.Error:
      return i18n.t(i18n.l.perps.deposit.quote_error);
    case QuoteStatus.InsufficientBalance:
      return i18n.t(i18n.l.perps.deposit.insufficient_balance);
    case QuoteStatus.ZeroAmountError:
      return i18n.t(i18n.l.perps.deposit.zero_amount_error);
  }
}

function getErrorTextColor(status: QuoteStatus.Error | QuoteStatus.InsufficientBalance | QuoteStatus.ZeroAmountError): TextColor {
  switch (status) {
    case QuoteStatus.Error:
      return 'labelTertiary';
    case QuoteStatus.InsufficientBalance:
    case QuoteStatus.ZeroAmountError:
      return 'labelQuaternary';
  }
}

function quoteHasError(status: QuoteStatus): status is QuoteStatus.Error | QuoteStatus.InsufficientBalance | QuoteStatus.ZeroAmountError {
  return status === QuoteStatus.Error || status === QuoteStatus.InsufficientBalance || status === QuoteStatus.ZeroAmountError;
}
