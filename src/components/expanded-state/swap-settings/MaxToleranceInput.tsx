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
} from '@rainbow-me/design-system';
import { Network } from '@rainbow-me/helpers';
import {
  add,
  convertNumberToString,
  greaterThan,
} from '@rainbow-me/helpers/utilities';
import { useMagicAutofocus, useSwapSettings } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';

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
        const slippage = getDefaultSlippageFromConfig(currentNetwork);
        onSlippageChange(convertBipsToPercent(slippage));
      },
    }));

    const updateSlippage = useCallback(
      increment => {
        const newSlippage = add(slippageValue, increment);
        const newSlippageValue = convertNumberToString(newSlippage);
        if (greaterThan(0, newSlippageValue)) return;

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
      value => {
        updateSwapSlippage(convertPercentToBips(value));
        setSlippageValue(value);
      },
      [updateSwapSlippage, setSlippageValue]
    );

    const openExplainer = () => {
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
              // @ts-expect-error
              onPress={openExplainer}
              paddingVertical="12px"
            >
              <Inline alignVertical="center">
                <Text size="16px" weight="bold">
                  {`${lang.t('exchange.slippage_tolerance')} `}
                  {!hasPriceImpact && (
                    <Text color="secondary30" size="16px" weight="bold">
                      {' 􀅵'}
                    </Text>
                  )}
                </Text>
                {hasPriceImpact && (
                  <Box paddingTop={android ? '2px' : '1px'}>
                    <Icon color={priceImpactColor} name="warning" size={18} />
                  </Box>
                )}
              </Inline>
            </Box>
            {hasPriceImpact && (
              <Box>
                <Text size={android ? '12px' : '14px'}>
                  <AccentColorProvider color={priceImpactColor!}>
                    <Text
                      color="accent"
                      size={android ? '12px' : '14px'}
                      weight="bold"
                    >
                      {lang.t('exchange.high')}
                    </Text>
                  </AccentColorProvider>
                  <Text
                    color="secondary50"
                    size={android ? '12px' : '14px'}
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
