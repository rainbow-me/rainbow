import React, { useMemo, useRef } from 'react';
import { AnimatedText, Box, Separator, Text, TextShadow, useForegroundColor } from '@/design-system';
import { CollapsableField } from './CollapsableField';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { runOnJS, SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { FIELD_BORDER_RADIUS, FIELD_BORDER_WIDTH, FIELD_INNER_BORDER_RADIUS, INNER_FIELD_BACKGROUND_COLOR } from '../constants';
import { Grid } from './Grid';
import { SingleFieldInput, SingleFieldInputRef } from './SingleFieldInput';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { roundToSignificant1or5 } from '@/helpers/utilities';

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
  const tokenomics = useTokenLauncherStore(state => state.tokenomics());
  const marketCapEth = tokenomics?.marketCap.targetEth ?? 10;

  const inputRef = useRef<SingleFieldInputRef>(null);
  const borderColor = useForegroundColor('buttonStroke');
  const errorColor = useForegroundColor('red');
  const subtitleColor = useForegroundColor('labelQuaternary');

  const chainId = useTokenLauncherStore(state => state.chainId);
  const setCreatorBuyInEth = useTokenLauncherStore(state => state.setCreatorBuyInEth);
  const nativeAssetForChain = useUserAssetsStore(state => state.getNativeAssetForChain(chainId));

  const customInputError = useSharedValue('');

  const prebuyEthOptions = useMemo(() => {
    const totalSupplyPercentages = [0.005, 0.01, 0.05, 0.1];

    const amounts = totalSupplyPercentages.map(percentage => {
      return roundToSignificant1or5(marketCapEth * percentage);
    });

    const uniqueAmounts = Array.from(new Set(amounts));

    // If we lost any options due to deduplication, add more with higher percentages
    let nextPercentage = totalSupplyPercentages[totalSupplyPercentages.length - 1] + 0.025;

    while (uniqueAmounts.length < 4) {
      const rawAmount = marketCapEth * nextPercentage;
      const amount = roundToSignificant1or5(rawAmount);
      if (!uniqueAmounts.some(option => option === amount)) {
        uniqueAmounts.push(amount);
      }
      nextPercentage += 0.025;
    }

    return uniqueAmounts.slice(0, 4).map(amount => ({
      label: `${amount} ETH`,
      amount,
    }));
  }, [marketCapEth]);

  const maxPrebuyAmountEth = prebuyEthOptions[prebuyEthOptions.length - 1].amount;

  const customInputSubtitle = useDerivedValue(() => {
    return customInputError.value === '' ? `Balance: ${nativeAssetForChain?.balance.display ?? '0'}` : customInputError.value;
  });

  const customInputSubtitleStyle = useAnimatedStyle(() => {
    return {
      color: customInputError.value === '' ? subtitleColor : errorColor,
    };
  });

  const selectedPrebuyEthAmount = useSharedValue(0);

  return (
    <CollapsableField title="Pre-buy more tokens">
      <Box gap={16}>
        <Grid columns={2} spacing={8}>
          {prebuyEthOptions.map(option => (
            <PrebuyAmountButton
              key={option.amount}
              label={option.label}
              amount={option.amount}
              selectedAmount={selectedPrebuyEthAmount}
              onPressJS={() => {
                const isSelected = selectedPrebuyEthAmount.value === option.amount;
                if (isSelected) {
                  setCreatorBuyInEth(option.amount);
                  inputRef.current?.setNativeTextWithInputValidation(option.amount.toString());
                } else {
                  setCreatorBuyInEth(0);
                  inputRef.current?.setNativeTextWithInputValidation('');
                }
              }}
              onPressWorklet={() => {
                'worklet';
                if (selectedPrebuyEthAmount.value === option.amount) {
                  selectedPrebuyEthAmount.value = 0;
                } else {
                  selectedPrebuyEthAmount.value = option.amount;
                }
              }}
            />
          ))}
        </Grid>
        <Separator color={{ custom: borderColor }} />
        <Box gap={8}>
          <SingleFieldInput
            ref={inputRef}
            title="ETH"
            labelPosition="right"
            placeholder="Custom amount"
            inputMode="decimal"
            onInputChange={text => {
              'worklet';
              if (selectedPrebuyEthAmount.value !== 0) {
                selectedPrebuyEthAmount.value = 0;
              }
              runOnJS(setCreatorBuyInEth)(parseFloat(text));
            }}
            validationWorklet={text => {
              'worklet';
              // Kind of janky that we're changing "state" in this callback
              const amount = parseFloat(text);
              const balance = parseFloat(nativeAssetForChain?.balance.amount ?? '0');

              if (amount > balance) {
                customInputError.value = `Amount is greater than balance`;
                return { error: true };
              }

              if (amount > maxPrebuyAmountEth) {
                customInputError.value = `Exceeds max pre-buy amount of ${maxPrebuyAmountEth} ETH`;
                return { error: true };
              }

              if (customInputError.value !== '') {
                customInputError.value = '';
              }
            }}
            style={{
              backgroundColor: INNER_FIELD_BACKGROUND_COLOR,
              paddingVertical: 0,
              paddingHorizontal: 16,
              borderRadius: FIELD_INNER_BORDER_RADIUS,
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
