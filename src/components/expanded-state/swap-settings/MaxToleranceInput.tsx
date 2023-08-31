import lang from 'i18n-js';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Keyboard } from 'react-native';
import { getDefaultSlippageFromConfig } from '../../../screens/ExchangeModal';
import { ButtonPressAnimation } from '../../animations';
import { Icon } from '../../icons';
import StepButtonInput from './StepButtonInput';
import {
  AccentColorProvider,
  Box,
  Column,
  Columns,
  Inline,
  Stack,
  Text,
} from '@/design-system';
import { Network } from '@/helpers';
import { add, convertNumberToString, greaterThan } from '@/helpers/utilities';
import { useMagicAutofocus, useSwapSettings } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { colors } from '@/styles';

const convertBipsToPercent = (bips: number) => (bips / 100).toString();
const convertPercentToBips = (percent: number) => (percent * 100).toString();

const SLIPPAGE_INCREMENT = 0.1;

// eslint-disable-next-line react/display-name
export const MaxToleranceInput = forwardRef(
  (
    {
      colorForAsset,
      currentNetwork,
    }: { colorForAsset: string; currentNetwork: Network },
    ref
  ) => {
    const { slippageInBips, updateSwapSlippage } = useSwapSettings();
    const { navigate } = useNavigation();

    const [slippageValue, setSlippageValue] = useState(
      convertBipsToPercent(slippageInBips)
    );

    const slippageRef = useRef<{ blur: () => void; focus: () => void }>(null);

    const { handleFocus } = useMagicAutofocus(slippageRef, undefined, true);

    const { hasPriceImpact, priceImpactColor } = useMemo(() => {
      const hasPriceImpact = Number(slippageValue) >= 3;
      const priceImpactColor = hasPriceImpact ? colors.orange : null;
      return { hasPriceImpact, priceImpactColor };
    }, [slippageValue]);

    useImperativeHandle(ref, () => ({
      blur: () => {
        slippageRef?.current?.blur();
      },
      reset: () => {
        const slippage = (getDefaultSlippageFromConfig(
          currentNetwork
        ) as unknown) as number;
        onSlippageChange(convertBipsToPercent(slippage));
      },
    }));

    const updateSlippage = useCallback(
      (increment: any) => {
        const newSlippage = add(slippageValue, increment);
        const newSlippageValue = convertNumberToString(newSlippage);
        if (greaterThan(0, newSlippageValue)) return;

        // @ts-expect-error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
        updateSwapSlippage(convertPercentToBips(parseFloat(newSlippageValue)));
        setSlippageValue(newSlippageValue);
      },
      [slippageValue, updateSwapSlippage]
    );

    const addSlippage = useCallback(() => {
      updateSlippage(SLIPPAGE_INCREMENT);
    }, [updateSlippage]);

    const minusSlippage = useCallback(() => {
      updateSlippage(-SLIPPAGE_INCREMENT);
    }, [updateSlippage]);

    const onSlippageChange = useCallback(
      (value: any) => {
        // @ts-expect-error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
        updateSwapSlippage(convertPercentToBips(value));
        setSlippageValue(value);
      },
      [updateSwapSlippage, setSlippageValue]
    );

    const openSlippageExplainer = () => {
      Keyboard.dismiss();
      navigate(Routes.EXPLAIN_SHEET, {
        type: 'slippage',
      });
    };

    return (
      <Columns alignHorizontal="justify" alignVertical="center">
        <Column width="content">
          <Stack space="4px">
            <Box
              as={ButtonPressAnimation}
              marginVertical="-12px"
              // @ts-ignore overloaded props

              onPress={openSlippageExplainer}
              paddingVertical="12px"
              testID="swap-slippage-label"
            >
              <Inline alignVertical="center">
                <Text
                  color="primary (Deprecated)"
                  size="16px / 22px (Deprecated)"
                  weight="bold"
                >
                  {`${lang.t('exchange.slippage_tolerance')} `}
                  {!hasPriceImpact && (
                    <Text
                      color="secondary30 (Deprecated)"
                      size="16px / 22px (Deprecated)"
                      weight="bold"
                    >
                      {' 􀅵'}
                    </Text>
                  )}
                </Text>
                {hasPriceImpact && (
                  <Box paddingTop={android ? '2px' : '1px (Deprecated)'}>
                    <Icon color={priceImpactColor} name="warning" size={18} />
                  </Box>
                )}
              </Inline>
            </Box>
            {hasPriceImpact && (
              <Box>
                <Text
                  color="primary (Deprecated)"
                  size={
                    android
                      ? '12px / 14px (Deprecated)'
                      : '14px / 19px (Deprecated)'
                  }
                >
                  <AccentColorProvider color={priceImpactColor!}>
                    <Text
                      color="accent"
                      size={
                        android
                          ? '12px / 14px (Deprecated)'
                          : '14px / 19px (Deprecated)'
                      }
                      weight="bold"
                    >
                      {lang.t('exchange.high')}
                    </Text>
                  </AccentColorProvider>
                  <Text
                    color="secondary50 (Deprecated)"
                    size={
                      android
                        ? '12px / 14px (Deprecated)'
                        : '14px / 19px (Deprecated)'
                    }
                    weight="bold"
                  >{` · ${lang.t('exchange.price_impact.label')}`}</Text>
                </Text>
              </Box>
            )}
          </Stack>
        </Column>
        <Column width="content">
          <StepButtonInput
            buttonColor={colorForAsset}
            inputLabel="%"
            inputRef={slippageRef}
            minusAction={minusSlippage}
            onBlur={null}
            onChange={onSlippageChange}
            onFocus={handleFocus}
            plusAction={addSlippage}
            testID="swap-slippage-input"
            value={slippageValue}
          />
        </Column>
      </Columns>
    );
  }
);
