import React, { useCallback, useMemo, useRef } from 'react';
import * as i18n from '@/languages';
import { AnimatedText, Box, Separator, TextShadow, useForegroundColor } from '@/design-system';
import { CollapsableField } from './CollapsableField';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { runOnJS, SharedValue, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import {
  ERROR_RED,
  FIELD_BORDER_RADIUS,
  FIELD_BORDER_WIDTH,
  FIELD_INNER_BORDER_RADIUS,
  INNER_FIELD_BACKGROUND_COLOR,
  SMALL_INPUT_HEIGHT,
  TOTAL_SUPPLY_PREBUY_PERCENTAGES,
} from '../constants';
import { Grid } from './Grid';
import { SingleFieldInput, SingleFieldInputRef } from './SingleFieldInput';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { convertAmountToBalanceDisplay, lessThan, subtract } from '@/helpers/utilities';
import { lessThanWorklet } from '@/safe-math/SafeMath';
import { useDebouncedCallback } from 'use-debounce';

function PrebuyAmountButton({
  label,
  amount,
  selectedAmount,
  onPressWorklet,
  onPressJS,
}: {
  label: string;
  amount: number;
  selectedAmount: SharedValue<number>;
  onPressWorklet: () => void;
  onPressJS: () => void;
}) {
  const { accentColors } = useTokenLauncherContext();

  const isSelected = useDerivedValue(() => {
    return selectedAmount.value === amount;
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: isSelected.value ? accentColors.opacity100 : accentColors.opacity6,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      color: isSelected.value ? 'rgba(0, 0, 0, 0.5)' : accentColors.opacity100,
    };
  });

  return (
    <GestureHandlerButton
      style={[
        containerStyle,
        {
          flex: 1,
          paddingVertical: 10 - FIELD_BORDER_WIDTH,
          borderRadius: FIELD_BORDER_RADIUS,
          borderWidth: FIELD_BORDER_WIDTH,
          borderColor: accentColors.opacity3,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        },
      ]}
      onPressWorklet={onPressWorklet}
      onPressJS={onPressJS}
      hapticTrigger="tap-end"
    >
      <TextShadow blur={12} shadowOpacity={0.24} color={accentColors.opacity100}>
        <AnimatedText style={textStyle} size="17pt" weight="heavy">
          {label}
        </AnimatedText>
      </TextShadow>
    </GestureHandlerButton>
  );
}

export function PrebuySection() {
  const { chainNativeAsset } = useTokenLauncherContext();
  const tokenomics = useTokenLauncherStore(state => state.tokenomics());
  const chainNativeAssetRequiredForTransactionGas = useTokenLauncherStore(state => state.chainNativeAssetRequiredForTransactionGas);
  const marketCapChainNativeAsset = tokenomics?.marketCap.targetEth ?? 10;
  const setHasValidPrebuyAmount = useTokenLauncherStore(state => state.setHasValidPrebuyAmount);
  const chainId = useTokenLauncherStore(state => state.chainId);
  const setExtraBuyAmount = useTokenLauncherStore(state => state.setExtraBuyAmount);
  const chainNativeAssetUser = useUserAssetsStore(state => state.getNativeAssetForChain(chainId));
  const chainNativeAssetSymbol = chainNativeAsset?.symbol;

  const selectedAmount = useSharedValue(0);

  const chainNativeAssetAvailableBalance = useMemo(() => {
    const balance = chainNativeAssetUser?.balance.amount;
    if (!balance) {
      return 0;
    }
    const balanceMinusGas = subtract(balance, chainNativeAssetRequiredForTransactionGas);
    return lessThan(balanceMinusGas, 0) ? 0 : balanceMinusGas;
  }, [chainNativeAssetUser, chainNativeAssetRequiredForTransactionGas]);

  const nativeAssetForChainAvailableBalanceDisplay = useMemo(() => {
    if (!chainNativeAsset) {
      return '0';
    }
    return convertAmountToBalanceDisplay(chainNativeAssetAvailableBalance, chainNativeAsset);
  }, [chainNativeAssetAvailableBalance, chainNativeAsset]);

  const balanceAfterGasFeeText = useMemo(() => {
    return `${i18n.t(i18n.l.token_launcher.prebuy.balance_after_gas_fee, { balance: nativeAssetForChainAvailableBalanceDisplay })}`;
  }, [nativeAssetForChainAvailableBalanceDisplay]);

  const inputRef = useRef<SingleFieldInputRef>(null);
  const borderColor = useForegroundColor('buttonStroke');
  const subtitleColor = useForegroundColor('labelQuaternary');

  const error = useSharedValue('');

  useAnimatedReaction(
    () => {
      return error.value;
    },
    error => {
      runOnJS(setHasValidPrebuyAmount)(error === '');
    }
  );

  const prebuyOptions = useMemo(() => {
    return TOTAL_SUPPLY_PREBUY_PERCENTAGES.map(percentage => {
      if (!marketCapChainNativeAsset) {
        return {
          label: '0 ETH',
          amount: 0,
        };
      }

      const nativeAssetAmount = (marketCapChainNativeAsset * percentage).toFixed(2);

      return {
        label: `${nativeAssetAmount} ${chainNativeAssetSymbol}`,
        amount: parseFloat(nativeAssetAmount),
      };
    });
  }, [marketCapChainNativeAsset, chainNativeAssetSymbol]);

  const maxPrebuyAmount = prebuyOptions[prebuyOptions.length - 1].amount;

  const customInputSubtitle = useDerivedValue(() => {
    return error.value === '' ? balanceAfterGasFeeText : error.value;
  });

  const customInputSubtitleStyle = useAnimatedStyle(() => {
    return {
      color: error.value === '' ? subtitleColor : ERROR_RED,
    };
  });

  const onInputChange = useDebouncedCallback((text: string) => {
    'worklet';
    if (selectedAmount.value !== 0) {
      selectedAmount.value = 0;
    }
    const value = parseFloat(text) || 0;
    const isValueOutOfRange = lessThanWorklet(chainNativeAssetAvailableBalance, value) || lessThanWorklet(maxPrebuyAmount, value);
    // Don't set the amount if it's out of range to avoid extreme tokenomics calculations
    if (!isValueOutOfRange) {
      runOnJS(setExtraBuyAmount)(value);
    }
  }, 300);

  const validationWorklet = useCallback(
    (text: string) => {
      'worklet';
      const amount = parseFloat(text) || 0;

      if (lessThanWorklet(chainNativeAssetAvailableBalance, amount)) {
        error.value = i18n.t(i18n.l.token_launcher.input_errors.amount_is_greater_than_balance);
        return { error: true };
      }

      if (lessThanWorklet(maxPrebuyAmount, amount)) {
        error.value = i18n.t(i18n.l.token_launcher.input_errors.amount_is_greater_than_max_prebuy_amount, {
          maxPrebuyAmount: maxPrebuyAmount,
          chainNativeAssetSymbol,
        });
        return { error: true };
      }

      if (error.value !== '') {
        error.value = '';
      }
    },
    [chainNativeAssetAvailableBalance, chainNativeAssetSymbol, error, maxPrebuyAmount]
  );

  return (
    <CollapsableField title={i18n.t(i18n.l.token_launcher.prebuy.title)}>
      <Box gap={16}>
        <Grid columns={2} spacing={8}>
          {prebuyOptions.map(option => (
            <PrebuyAmountButton
              key={option.amount}
              label={option.label}
              amount={option.amount}
              selectedAmount={selectedAmount}
              onPressJS={() => {
                const isSelected = selectedAmount.value === option.amount;
                if (isSelected) {
                  setExtraBuyAmount(option.amount);
                  inputRef.current?.setNativeTextWithInputValidation(option.amount.toString());
                } else {
                  setExtraBuyAmount(0);
                  inputRef.current?.setNativeTextWithInputValidation('');
                }
              }}
              onPressWorklet={() => {
                'worklet';
                if (selectedAmount.value === option.amount) {
                  selectedAmount.value = 0;
                } else {
                  selectedAmount.value = option.amount;
                }
              }}
            />
          ))}
        </Grid>
        <Separator color={{ custom: borderColor }} />
        <Box gap={8}>
          <SingleFieldInput
            ref={inputRef}
            title={chainNativeAssetSymbol}
            labelPosition="right"
            placeholder="Custom amount"
            inputMode="decimal"
            onInputChange={onInputChange}
            validationWorklet={validationWorklet}
            style={{
              backgroundColor: INNER_FIELD_BACKGROUND_COLOR,
              paddingHorizontal: 16,
              borderRadius: FIELD_INNER_BORDER_RADIUS,
              height: SMALL_INPUT_HEIGHT,
            }}
          />
          <AnimatedText style={[{ paddingHorizontal: 20 }, customInputSubtitleStyle]} color="labelQuaternary" size="12pt" weight="bold">
            {customInputSubtitle}
          </AnimatedText>
        </Box>
      </Box>
    </CollapsableField>
  );
}
