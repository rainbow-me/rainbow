import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { addCommasToNumber, opacity, stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { AccountImage } from '@/components/AccountImage';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import Page from '@/components/layout/Page';
import { Navbar } from '@/components/navbar/Navbar';
import { AnimatedText, Box, Inline, Inset, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { InputValueCaret } from '@/features/perps/components/InputValueCaret';
import { NumberPad } from '@/features/perps/components/NumberPad/NumberPad';
import { PerpsSwapButton } from '@/features/perps/components/PerpsSwapButton';
import { PerpsTextSkeleton } from '@/features/perps/components/PerpsTextSkeleton';
import { SheetHandle } from '@/features/perps/components/SheetHandle';
import { SliderWithLabels } from '@/features/perps/components/Slider';
import { HYPERLIQUID_COLORS, PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT, USD_DECIMALS, USDC_ASSET } from '@/features/perps/constants';
import { PerpsAccentColorContextProvider } from '@/features/perps/context/PerpsAccentColorContext';
import { hyperliquidAccountActions, useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import * as i18n from '@/languages';
import { ensureError, logger, RainbowError } from '@/logger';
import { Navigation } from '@/navigation';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';
import { sanitizeAmount } from '@/worklets/strings';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { runOnJS, SharedValue, useAnimatedReaction, useDerivedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FOOTER_HEIGHT, SLIDER_WIDTH, SLIDER_WITH_LABELS_HEIGHT } from './constants';
import { PerpsWithdrawalProvider, usePerpsWithdrawalContext } from './PerpsWithdrawalContext';
import { usePerpsWithdrawalController } from './hooks/usePerpsWithdrawalController';
import { SEPARATOR_COLOR, THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { palettes } from '@/design-system/color/palettes';
import { analytics } from '@/analytics';

export const PerpsWithdrawalScreen = memo(function PerpsWithdrawalScreen() {
  return (
    <PerpsWithdrawalProvider>
      <PerpsWithdrawalScreenContent />
    </PerpsWithdrawalProvider>
  );
});

const PerpsWithdrawalScreenContent = memo(function PerpsWithdrawalScreenContent() {
  const { isDarkMode } = useColorMode();
  const { useWithdrawalStore, withdrawalActions } = usePerpsWithdrawalContext();
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const insets = useSafeAreaInsets();

  const availableBalance = useHyperliquidAccountStore(state => state.getBalance());
  const isBalanceLoading = useHyperliquidAccountStore(state => state.getStatus('isInitialLoad'));
  const formattedBalance = `$${addCommasToNumber(toFixedWorklet(availableBalance, USD_DECIMALS), '0')}`;

  const {
    balance,
    displayedAmount,
    fields,
    handlePressMaxWorklet,
    handleSliderBeginWorklet,
    handleNumberPadChange,
    inputMethod,
    isAtMax,
    sliderProgress,
  } = usePerpsWithdrawalController();

  const sliderColors = useMemo(
    () => ({
      activeLeft: HYPERLIQUID_COLORS.green,
      activeRight: separatorSecondary,
      inactiveLeft: HYPERLIQUID_COLORS.green,
      inactiveRight: separatorSecondary,
    }),
    [separatorSecondary]
  );

  const formattedInputAmount = useDerivedValue(() => {
    const value = displayedAmount.value;
    if (!value || value === '0') return '$0';
    const formatted = addCommasToNumber(value, '0');
    return `$${formatted}`;
  });

  useDerivedValue(() => {
    console.log('isAtMax', isAtMax.value);
  });

  const handleSwap = useCallback(async () => {
    withdrawalActions.setIsSubmitting(true);
    const amountToWithdraw = isAtMax.value ? balance.value : displayedAmount.value;
    const sanitizedAmount = sanitizeAmount(amountToWithdraw);
    try {
      await hyperliquidAccountActions.withdraw(sanitizedAmount);
      analytics.track(analytics.event.perpsWithdrew, {
        amount: Number(sanitizedAmount),
      });
      Navigation.goBack();
    } catch (e) {
      const error = ensureError(e);
      const message = error.message;
      logger.error(new RainbowError(`[PerpsWithdrawalScreen]: Error withdrawing: ${message}`, e));
      analytics.track(analytics.event.perpsWithdrawFailed, {
        amount: Number(sanitizedAmount),
        errorMessage: message,
      });
    } finally {
      withdrawalActions.setIsSubmitting(false);
    }
  }, [balance, displayedAmount, isAtMax, withdrawalActions]);

  const formattedValues = useDerivedValue<Record<string, string>>(() => {
    return {
      inputAmount: formattedInputAmount.value,
    };
  });

  const inputAmountErrorShared = useDerivedValue(() => {
    const amountToCheck = isAtMax.value ? balance.value : displayedAmount.value;
    const amountNumber = Number(amountToCheck || '0');
    if (amountNumber === 0) return 'zero';
    if (amountNumber > Number(availableBalance)) return 'overBalance';
    return null;
  });

  const [inputAmountError, setInputAmountError] = useState<'overBalance' | 'zero' | null>(null);
  useAnimatedReaction(
    () => inputAmountErrorShared.value,
    newError => {
      runOnJS(setInputAmountError)(newError);
    }
  );

  const getConfirmButtonLabel = useCallback(() => {
    if (inputAmountError === 'zero') {
      return i18n.t(i18n.l.perps.withdraw.confirm_button_zero_text);
    }
    if (inputAmountError === 'overBalance') {
      return i18n.t(i18n.l.perps.withdraw.confirm_button_over_balance_text);
    }
    if (useWithdrawalStore.getState().isSubmitting) {
      return i18n.t(i18n.l.perps.withdraw.confirm_button_loading_text);
    }
    return i18n.t(i18n.l.perps.withdraw.confirm_button_text);
  }, [inputAmountError, useWithdrawalStore]);

  return (
    <PerpsAccentColorContextProvider>
      <Box
        as={Page}
        backgroundColor={isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT}
        height={DEVICE_HEIGHT}
        testID="perps-withdraw-screen"
        width="full"
      >
        <SheetHandle />
        <Box paddingTop="8px">
          <Navbar hasStatusBarInset leftComponent={<AccountImage />} title={i18n.t(i18n.l.perps.withdraw.title)} />
        </Box>

        <View style={{ top: -10, alignSelf: 'center' }}>
          {isBalanceLoading ? (
            <PerpsTextSkeleton width={150} height={15} />
          ) : (
            <Text align="center" size="15pt" weight="bold" color="labelTertiary">
              {formattedBalance}
              <Text color="labelQuaternary" size="15pt" weight="bold">
                {i18n.t(i18n.l.perps.withdraw.available_balance_suffix)}
              </Text>
            </Text>
          )}
        </View>

        <Box alignItems="center" flexGrow={1} flexShrink={1}>
          <WithdrawalInputSection formattedInputAmount={formattedInputAmount} balanceLoading={isBalanceLoading} />
        </Box>
        <WithdrawalInfoCard />
        <SliderWithLabels
          progressValue={sliderProgress}
          width={SLIDER_WIDTH}
          containerStyle={{ height: SLIDER_WITH_LABELS_HEIGHT, marginHorizontal: 20, justifyContent: 'center' }}
          onGestureBeginWorklet={handleSliderBeginWorklet}
          onPressMaxWorklet={handlePressMaxWorklet}
          showMaxButton={true}
          showPercentage={true}
          labels={{ title: i18n.t(i18n.l.perps.withdraw.slider_label) }}
          icon={<AssetCoinIcon asset={USDC_ASSET} size={16} showBadge={false} />}
          colors={sliderColors}
        />
        <NumberPad
          activeFieldId={inputMethod}
          fields={fields}
          formattedValues={formattedValues}
          onValueChange={handleNumberPadChange}
          stripFormatting={stripNonDecimalNumbers}
        />
        <Box
          marginBottom={{ custom: insets.bottom }}
          width="full"
          paddingHorizontal="20px"
          paddingTop="16px"
          paddingBottom="8px"
          height={{ custom: FOOTER_HEIGHT }}
          flexDirection="row"
          gap={12}
          alignItems="center"
        >
          <Box flexGrow={1}>
            <PerpsSwapButton
              label={getConfirmButtonLabel()}
              onLongPress={handleSwap}
              disabled={isBalanceLoading || inputAmountError != null}
              disabledOpacity={inputAmountError != null ? 1 : undefined}
            />
          </Box>
        </Box>
      </Box>
    </PerpsAccentColorContextProvider>
  );
});

const WithdrawalInfoCard = memo(function WithdrawalInfoCard() {
  const { isDarkMode } = useColorMode();
  const background = isDarkMode ? undefined : 'fillQuaternary';
  const backgroundColor = isDarkMode ? opacity(palettes.dark.backgroundColors.fillQuaternary.color, 0.025) : undefined;
  const borderColor = isDarkMode ? SEPARATOR_COLOR : palettes.light.foregroundColors.separatorTertiary;
  return (
    <Inset bottom="10px" horizontal="20px">
      <Box
        background={background}
        backgroundColor={backgroundColor}
        borderColor={{ custom: borderColor }}
        borderWidth={THICKER_BORDER_WIDTH}
        borderRadius={24}
        gap={12}
        padding="20px"
      >
        <Inline alignVertical="center" horizontalSpace="6px" wrap={false}>
          <TextIcon color={{ custom: HYPERLIQUID_COLORS.green }} height={8} size="icon 13px" weight="bold" width={20}>
            􀄵
          </TextIcon>
          <Text color="labelQuaternary" size="15pt" weight="bold">
            {i18n.t(i18n.l.perps.withdraw.info_card_title_prefix)}
            <Text color="labelTertiary" size="15pt" weight="bold">
              {i18n.t(i18n.l.perps.withdraw.info_card_title_suffix)}
            </Text>
          </Text>
        </Inline>
        <Text color={isDarkMode ? 'labelQuinary' : 'labelQuaternary'} size="13pt" weight="semibold">
          {i18n.t(i18n.l.perps.withdraw.info_card_subtitle)}
        </Text>
      </Box>
    </Inset>
  );
});

const AssetCoinIcon = ({
  asset,
  size,
  showBadge,
}: {
  asset: ExtendedAnimatedAssetWithColors | Pick<ExtendedAnimatedAssetWithColors, 'chainId' | 'icon_url' | 'symbol'> | null;
  size: number;
  showBadge?: boolean;
}) => {
  if (!asset) return null;
  return <RainbowCoinIcon chainId={asset.chainId} symbol={asset.symbol} icon={asset.icon_url} size={size} showBadge={showBadge} />;
};

const WithdrawalInputSection = memo(function WithdrawalInputSection({
  formattedInputAmount,
  balanceLoading,
}: {
  formattedInputAmount: SharedValue<string>;
  balanceLoading: boolean;
}) {
  return (
    <Box testID={'swap-asset-input'} as={Animated.View} flexGrow={1} gap={20}>
      <Box alignItems="center" justifyContent="center" flexGrow={1} gap={16}>
        {balanceLoading ? (
          <PerpsTextSkeleton width={180} height={44} />
        ) : (
          <Box gap={2} flexDirection="row" alignItems="center">
            <AnimatedText
              size="44pt"
              weight="heavy"
              color={{ custom: HYPERLIQUID_COLORS.green }}
              tabularNumbers
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {formattedInputAmount}
            </AnimatedText>
            <InputValueCaret color={HYPERLIQUID_COLORS.green} value={formattedInputAmount} />
          </Box>
        )}
      </Box>
    </Box>
  );
});
