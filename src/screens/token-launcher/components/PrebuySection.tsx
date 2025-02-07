import React from 'react';
import { AnimatedText, Box, Separator, Text, TextShadow, useForegroundColor } from '@/design-system';
import { CollapsableField } from './CollapsableField';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { runOnJS, SharedValue, useAnimatedRef, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { FIELD_BORDER_RADIUS, FIELD_BORDER_WIDTH, FIELD_INNER_BORDER_RADIUS, INNER_FIELD_BACKGROUND_COLOR } from '../constants';
import { Grid } from './Grid';
import { SingleFieldInput } from './SingleFieldInput';
import { TextInput } from 'react-native';
import { useUserAssetsStore } from '@/state/assets/userAssets';

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
  const accentColors = useTokenLauncherStore(state => state.accentColors);

  const isSelected = useDerivedValue(() => {
    return selectedAmount.value === amount;
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: isSelected.value ? accentColors.primary : accentColors.background,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      color: isSelected.value ? 'rgba(0, 0, 0, 0.5)' : accentColors.primary,
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
          borderColor: accentColors.border,
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
  // TODO: pull from sdk
  const MAX_PREBUY_ETH_AMOUNT = 5;

  // Last is max
  const prebuyEthOptions = [
    {
      label: '0.1 ETH',
      amount: 0.1,
    },
    {
      label: '0.5 ETH',
      amount: 0.5,
    },
    {
      label: '1 ETH',
      amount: 1,
    },
    {
      label: 'Max',
      amount: MAX_PREBUY_ETH_AMOUNT,
    },
  ];

  const inputRef = useAnimatedRef<TextInput>();
  const borderColor = useForegroundColor('buttonStroke');
  const errorColor = useForegroundColor('red');
  const subtitleColor = useForegroundColor('labelQuaternary');

  const chainId = useTokenLauncherStore(state => state.chainId);
  const setCreatorBuyInEth = useTokenLauncherStore(state => state.setCreatorBuyInEth);
  const nativeAssetForChain = useUserAssetsStore(state => state.getNativeAssetForChain(chainId));

  const customInputError = useSharedValue('');

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
                // Clear the custom input value
                inputRef.current?.clear();
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

              if (amount > MAX_PREBUY_ETH_AMOUNT) {
                customInputError.value = `Exceeds max pre-buy amount of ${MAX_PREBUY_ETH_AMOUNT} ETH`;
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
