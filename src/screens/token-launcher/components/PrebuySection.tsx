import React, { useMemo, useRef } from 'react';
import { AnimatedText, Box, Separator, Text, TextShadow, useForegroundColor } from '@/design-system';
import { CollapsableField } from './CollapsableField';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { runOnJS, SharedValue, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import {
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
import { convertAmountToBalanceDisplay, lessThan, roundToSignificant1or5, subtract } from '@/helpers/utilities';
import { lessThanWorklet } from '@/safe-math/SafeMath';

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
          paddingVertical: 14 - FIELD_BORDER_WIDTH,
          borderRadius: FIELD_BORDER_RADIUS,
          borderWidth: FIELD_BORDER_WIDTH,
          borderColor: accentColors.opacity3,
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
      onPressWorklet={onPressWorklet}
      onPressJS={onPressJS}
      hapticTrigger="tap-end"
    >
      {/* TODO: This is adding extra padding */}
      {/* <TextShadow blur={12} shadowOpacity={0.24} color={accentColors.primary}> */}
      <AnimatedText style={textStyle} size="17pt" weight="heavy">
        {label}
      </AnimatedText>
      {/* </TextShadow> */}
    </GestureHandlerButton>
  );
}

export function PrebuySection() {
  const { chainNativeAssetRequiredForTransactionGas, chainNativeAsset } = useTokenLauncherContext();
  const tokenomics = useTokenLauncherStore(state => state.tokenomics());
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

  const inputRef = useRef<SingleFieldInputRef>(null);
  const borderColor = useForegroundColor('buttonStroke');
  const errorColor = useForegroundColor('red');
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
    const totalSupplyPercentages = TOTAL_SUPPLY_PREBUY_PERCENTAGES;

    const amounts = totalSupplyPercentages.map(percentage => {
      return roundToSignificant1or5(marketCapChainNativeAsset * percentage);
    });

    const uniqueAmounts = Array.from(new Set(amounts));

    // If we lost any options due to deduplication, add more with higher percentages
    let nextPercentage = totalSupplyPercentages[totalSupplyPercentages.length - 1] + 0.025;

    while (uniqueAmounts.length < 4) {
      const rawAmount = marketCapChainNativeAsset * nextPercentage;
      const amount = roundToSignificant1or5(rawAmount);
      if (!uniqueAmounts.some(option => option === amount)) {
        uniqueAmounts.push(amount);
      }
      nextPercentage += 0.025;
    }

    return uniqueAmounts.slice(0, 4).map(amount => ({
      label: `${amount} ${chainNativeAssetSymbol}`,
      amount,
    }));
  }, [marketCapChainNativeAsset, chainNativeAssetSymbol]);

  const maxPrebuyAmount = prebuyOptions[prebuyOptions.length - 1].amount;

  const customInputSubtitle = useDerivedValue(() => {
    return error.value === '' ? `Balance After Gas Fee: ${nativeAssetForChainAvailableBalanceDisplay}` : error.value;
  });

  const customInputSubtitleStyle = useAnimatedStyle(() => {
    return {
      color: error.value === '' ? subtitleColor : errorColor,
    };
  });

  return (
    <CollapsableField title="Pre-buy more tokens">
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
            onInputChange={text => {
              'worklet';
              if (selectedAmount.value !== 0) {
                selectedAmount.value = 0;
              }
              runOnJS(setExtraBuyAmount)(parseFloat(text));
            }}
            validationWorklet={text => {
              'worklet';
              // Kind of jank that we're changing "state" in this callback by setting error.value
              // TODO: is it safe to use parseFloat here?
              const amount = parseFloat(text) || 0;

              if (lessThanWorklet(chainNativeAssetAvailableBalance, amount)) {
                error.value = `Amount is greater than balance`;
                return { error: true };
              }

              if (lessThanWorklet(maxPrebuyAmount, amount)) {
                error.value = `Exceeds max pre-buy amount of ${maxPrebuyAmount} ${chainNativeAssetSymbol}`;
                return { error: true };
              }

              if (error.value !== '') {
                error.value = '';
              }
            }}
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
