import React, { memo } from 'react';
import Animated, { SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { BalanceBadge } from '@/__swaps__/screens/Swap/components/BalanceBadge';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { SwapActionButton } from '@/__swaps__/screens/Swap/components/SwapActionButton';
import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { AnimatedTextIcon } from '@/components/AnimatedComponents/AnimatedTextIcon';
import { ImgixImage } from '@/components/images';
import { AnimatedText, Bleed, Box, Column, Columns, Separator, Stack, Text, useColorMode } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { DepositQuoteStatus } from '@/features/funding/types';
import { InputValueCaret } from '@/features/perps/components/InputValueCaret';
import { PerpsTextSkeleton } from '@/features/perps/components/PerpsTextSkeleton';
import * as i18n from '@/languages';
import { useDepositContext } from '../../contexts/DepositContext';
import { DepositAssetCoinIcon } from './DepositAssetCoinIcon';

// ============ Types ========================================================== //

type DepositAmountInputProps = {
  displayedAmount: SharedValue<string>;
  displayedNativeValue: SharedValue<string>;
  inputMethod: SharedValue<'inputAmount' | 'inputNativeValue'>;
  onChangeInputMethod: () => void;
  onSelectAsset: () => void;
};

// ============ Component ====================================================== //

export const DepositAmountInput = memo(function DepositAmountInput({
  inputMethod,
  onChangeInputMethod,
  onSelectAsset,
}: DepositAmountInputProps) {
  const { isDarkMode } = useColorMode();
  const { config, minifiedAsset, primaryFormattedInput, secondaryFormattedInput, useDepositStore } = useDepositContext();

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
            <DepositAssetCoinIcon showBadge size={40} />
          </Box>
        </Column>
        <Column>
          <Stack alignHorizontal="left" space="12px">
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
              small
              style={{ marginLeft: 20 }}
            />
          </Column>
        )}
      </Columns>

      <Separator color="separatorTertiary" thickness={1} />

      <Box alignItems="center" flexGrow={1} gap={16} justifyContent="center" style={{ opacity: isAssetSelected ? 1 : 0.3 }}>
        <Box alignItems="center" flexDirection="row">
          <AnimatedText
            align="center"
            ellipsizeMode="middle"
            numberOfLines={1}
            size="44pt"
            style={[{ letterSpacing: 0.28 }, textColorStyle]}
            tabularNumbers
            weight="heavy"
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
          <Box alignItems="center" flexDirection="row" gap={4} justifyContent="center">
            <Box as={Animated.View} paddingHorizontal="2px" style={secondaryInputIconStyle}>
              <DepositAssetCoinIcon showBadge={false} size={16} />
            </Box>

            <AnimatedText
              align="center"
              color="labelSecondary"
              ellipsizeMode="middle"
              numberOfLines={1}
              size="17pt"
              tabularNumbers
              weight="bold"
            >
              {secondaryFormattedInput}
            </AnimatedText>

            <AnimatedTextIcon size="13pt" textStyle={textColorStyle} weight="heavy" width={20}>
              {'􀄬'}
            </AnimatedTextIcon>
          </Box>
        </GestureHandlerButton>
      </Box>

      {isAssetSelected && <QuoteOutput targetTokenIconUrl={config.to.token.iconUrl} />}
    </Box>
  );
});

// ============ Quote Output =================================================== //

const QuoteOutput = memo(function QuoteOutput({ targetTokenIconUrl }: { targetTokenIconUrl?: string }) {
  const { useAmountToReceive } = useDepositContext();
  const { formattedAmount, status } = useAmountToReceive();

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
            {targetTokenIconUrl && (
              <Bleed vertical="4px">
                <ImgixImage
                  enableFasterImage
                  size={14}
                  source={{ uri: targetTokenIconUrl }}
                  style={{ height: 14, marginRight: 6, width: 14 }}
                />
              </Bleed>
            )}
            <Text color="labelQuaternary" size="15pt" weight="bold">
              {i18n.t(i18n.l.perps.deposit.receive)}{' '}
            </Text>

            {status === DepositQuoteStatus.Pending ? (
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

// ============ Helpers ======================================================== //

function getErrorLabel(
  status: DepositQuoteStatus.Error | DepositQuoteStatus.InsufficientBalance | DepositQuoteStatus.ZeroAmountError
): string {
  switch (status) {
    case DepositQuoteStatus.Error:
      return i18n.t(i18n.l.perps.deposit.quote_error);
    case DepositQuoteStatus.InsufficientBalance:
      return i18n.t(i18n.l.perps.deposit.insufficient_balance);
    case DepositQuoteStatus.ZeroAmountError:
      return i18n.t(i18n.l.perps.deposit.zero_amount_error);
  }
}

function getErrorTextColor(
  status: DepositQuoteStatus.Error | DepositQuoteStatus.InsufficientBalance | DepositQuoteStatus.ZeroAmountError
): TextColor {
  switch (status) {
    case DepositQuoteStatus.Error:
      return 'labelTertiary';
    case DepositQuoteStatus.InsufficientBalance:
    case DepositQuoteStatus.ZeroAmountError:
      return 'labelQuaternary';
  }
}

function quoteHasError(
  status: DepositQuoteStatus
): status is DepositQuoteStatus.Error | DepositQuoteStatus.InsufficientBalance | DepositQuoteStatus.ZeroAmountError {
  return (
    status === DepositQuoteStatus.Error ||
    status === DepositQuoteStatus.InsufficientBalance ||
    status === DepositQuoteStatus.ZeroAmountError
  );
}
