import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { GasSpeed } from '@/__swaps__/types/gas';
import { addCommasToNumber, clamp, stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { ButtonPressAnimation } from '@/components/animations';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import ContactAvatar from '@/components/contacts/ContactAvatar';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import Page from '@/components/layout/Page';
import { Navbar } from '@/components/navbar/Navbar';
import { AnimatedText, Box, Text } from '@/design-system';
import { InputValueCaret } from '@/features/perps/components/InputValueCaret';
import { NumberPad } from '@/features/perps/components/NumberPad/NumberPad';
import { NumberPadField } from '@/features/perps/components/NumberPad/NumberPadKey';
import { PerpsSwapButton } from '@/features/perps/components/PerpsSwapButton';
import { PerpsTextSkeleton } from '@/features/perps/components/PerpsTextSkeleton';
import { SheetHandle } from '@/features/perps/components/SheetHandle';
import { SliderWithLabels } from '@/features/perps/components/Slider';
import { HYPERLIQUID_COLORS, SLIDER_WIDTH, USDC_ASSET } from '@/features/perps/constants';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import * as i18n from '@/languages';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/Routes';
import { divWorklet, mulWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import { GasButton } from '@/screens/token-launcher/components/gas/GasButton';
import { ChainId } from '@/state/backendNetworks/types';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { runOnJS, SharedValue, useAnimatedReaction, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FOOTER_HEIGHT, SLIDER_WITH_LABELS_HEIGHT } from './constants';
import { logger, RainbowError } from '@/logger';

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

type InputMethod = 'inputAmount' | 'inputNativeValue';

// Deposit Input Component
const DepositInputSection = ({
  formattedInputAmount,
  balanceLoading,
}: {
  formattedInputAmount: SharedValue<string>;
  balanceLoading: boolean;
}) => {
  return (
    <>
      <Box testID={'swap-asset-input'} as={Animated.View} flexGrow={1} gap={20}>
        <Box alignItems="center" justifyContent="center" flexGrow={1} gap={16}>
          {balanceLoading ? (
            <PerpsTextSkeleton width={180} height={44} />
          ) : (
            <Box gap={2} flexDirection="row" alignItems="center">
              <AnimatedText
                size="44pt"
                weight="heavy"
                color={{ custom: HYPERLIQUID_COLORS.mintGreen }}
                tabularNumbers
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {formattedInputAmount}
              </AnimatedText>
              <InputValueCaret color={HYPERLIQUID_COLORS.mintGreen} value={formattedInputAmount} />
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};

export const PerpsWithdrawalScreen = memo(function PerpsWithdrawalScreen() {
  const insets = useSafeAreaInsets();
  const { balance, status, withdraw } = useHyperliquidAccountStore();
  const balanceLoading = balance === '0' && status === 'loading';
  // TODO (kane): use neweset currency formatting
  const formattedBalance = `${toFixedWorklet(balance, 2)} USDC`;
  const { accountImage, accountColor, accountSymbol } = useAccountProfileInfo();

  // State for input values
  const inputMethod = useSharedValue<InputMethod>('inputAmount');
  const sliderXPosition = useSharedValue(SLIDER_WIDTH * 0.25); // Default to 25% of slider width

  const [gasSpeed, setGasSpeed] = useState(GasSpeed.FAST);
  const [loading, setLoading] = useState(false);

  const fieldsValueForAsset = useCallback(
    (percentage: number): Record<string, NumberPadField> => {
      'worklet';
      const inputAmount = mulWorklet(percentage, balance);

      return {
        inputAmount: {
          id: 'inputAmount',
          value: toFixedWorklet(inputAmount, 2),
          maxDecimals: 2,
          allowDecimals: true,
        },
      };
    },
    [balance]
  );

  const fields = useSharedValue<Record<string, NumberPadField>>(fieldsValueForAsset(0.25));

  useEffect(() => {
    fields.value = fieldsValueForAsset(0.25);
  }, [balance, fields, fieldsValueForAsset]);

  const sliderColors = {
    activeLeft: HYPERLIQUID_COLORS.mintGreen,
    inactiveLeft: HYPERLIQUID_COLORS.mintGreen,
    activeRight: 'rgba(244, 248, 255, 0.06)',
    inactiveRight: 'rgba(244, 248, 255, 0.06)',
  };

  // Formatted values
  const formattedInputAmount = useDerivedValue(() => {
    const value = fields.value.inputAmount.value;
    if (value === '0' || value === '') return '$0';
    const formatted = addCommasToNumber(value, '0');
    return `$${formatted}`;
  });

  const handleNumberPadChange = useCallback(
    (_fieldId: string, newValue: string | number) => {
      'worklet';

      // Update slider position
      const amount = Number(newValue);
      const maxAmount = Number(balance);
      const percentage = maxAmount > 0 ? Number(divWorklet(amount, maxAmount)) : 0;
      sliderXPosition.value = withSpring(clamp(percentage * SLIDER_WIDTH, 0, SLIDER_WIDTH), SPRING_CONFIGS.snappySpringConfig);
    },
    [balance, sliderXPosition]
  );

  const handlePercentageChange = useCallback(
    (percentage: number) => {
      'worklet';

      fields.value = fieldsValueForAsset(percentage);
    },
    [fields, fieldsValueForAsset]
  );

  const handleGestureUpdate = useCallback(
    (percentage: number) => {
      'worklet';

      handlePercentageChange(percentage);
    },
    [handlePercentageChange]
  );

  const handleSwap = useCallback(async () => {
    setLoading(true);
    try {
      const amount = fields.value.inputAmount.value;
      // TODO: Handle min values.
      await withdraw(String(amount));
      Navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generic error while trying to withdraw';
      logger.error(new RainbowError(`[withdraw]: ${message}`), {
        data: { error },
      });
    } finally {
      setLoading(false);
    }
  }, [fields, withdraw]);

  const formattedValues = useDerivedValue(() => {
    return {
      inputAmount: formattedInputAmount.value,
    } as Record<string, string>;
  });

  const inputAmountErrorShared = useDerivedValue(() => {
    const amountNumber = Number(fields.value.inputAmount.value || '0');
    if (amountNumber === 0) return 'zero';
    if (amountNumber > Number(balance)) return 'overBalance';
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
      return i18n.t(i18n.l.perps.withdraw.confirm_button_zero_text);
    }
    if (inputAmountError === 'overBalance') {
      return i18n.t(i18n.l.perps.withdraw.confirm_button_over_balance_text);
    }
    if (loading) {
      return i18n.t(i18n.l.perps.withdraw.confirm_button_loading_text);
    }
    return i18n.t(i18n.l.perps.withdraw.confirm_button_text);
  };

  return (
    <Box as={Page} height={DEVICE_HEIGHT} testID="perps-withdraw-screen" width="full">
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
        title={i18n.t(i18n.l.perps.withdraw.title)}
      />
      <View style={{ top: -10, alignSelf: 'center' }}>
        {balanceLoading ? (
          <PerpsTextSkeleton width={150} height={15} />
        ) : (
          <Text size="15pt" weight="bold" color="labelQuaternary">
            {i18n.t(i18n.l.perps.withdraw.available_balance, { balance: formattedBalance })}
          </Text>
        )}
      </View>

      <Box alignItems="center" flexGrow={1} flexShrink={1}>
        <DepositInputSection formattedInputAmount={formattedInputAmount} balanceLoading={balanceLoading} />
      </Box>
      <SliderWithLabels
        sliderXPosition={sliderXPosition}
        width={SLIDER_WIDTH}
        containerStyle={{ height: SLIDER_WITH_LABELS_HEIGHT, marginHorizontal: 20, justifyContent: 'center' }}
        onPercentageChange={handlePercentageChange}
        onPercentageUpdate={handleGestureUpdate}
        showMaxButton={true}
        showPercentage={true}
        labels={{ title: i18n.t(i18n.l.perps.withdraw.slider_label) }}
        icon={<AssetCoinIcon asset={USDC_ASSET as ExtendedAnimatedAssetWithColors} size={16} showBadge={false} />}
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
        marginBottom={{ custom: insets.bottom }}
        width="full"
        paddingHorizontal="20px"
        paddingTop="16px"
        height={{ custom: FOOTER_HEIGHT }}
        flexDirection="row"
        gap={20}
      >
        <Box width={96} alignItems="flex-start" justifyContent="center">
          <GasButton gasSpeed={gasSpeed} chainId={ChainId.mainnet} onSelectGasSpeed={setGasSpeed} gasLimit={'1'} />
        </Box>
        <Box flexGrow={1}>
          <PerpsSwapButton
            label={getConfirmButtonLabel()}
            onLongPress={handleSwap}
            disabled={loading || balanceLoading || inputAmountError != null}
            disabledOpacity={inputAmountError != null ? 1 : undefined}
          />
        </Box>
      </Box>
    </Box>
  );
});
