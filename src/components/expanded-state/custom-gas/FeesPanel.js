import { useNavigation } from '@react-navigation/core';
import { isEmpty, upperFirst } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, KeyboardAvoidingView } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import styled, { useTheme } from 'styled-components';
import colors, { darkModeThemeColors } from '../../../styles/colors';
import { ButtonPressAnimation } from '../../animations';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
import FeesGweiInput from './FeesGweiInput';
import {
  calculateMinerTipAddDifference,
  calculateMinerTipSubstDifference,
} from '@rainbow-me/helpers/gas';
import { greaterThan, isZero, multiply } from '@rainbow-me/helpers/utilities';
import { useGas } from '@rainbow-me/hooks';
import { gweiToWei, parseGasFeeParam } from '@rainbow-me/parsers';
import Routes from '@rainbow-me/routes';
import { fonts, fontWithWidth, margin, padding } from '@rainbow-me/styles';
import { gasUtils } from '@rainbow-me/utils';

const Wrapper = styled(KeyboardAvoidingView)``;

const PanelRow = styled(Row).attrs({
  alignItems: 'center',
  justify: 'space-between',
})``;

// GweiInputPill has a vertical padding of 10
const MiddlePanelRow = styled(PanelRow).attrs(() => ({}))`
  ${padding(8, 0)}
`;

const PanelRowThin = styled(Row).attrs({
  justify: 'space-between',
  marginBottom: 5,
})``;

const PanelLabel = styled(Text).attrs({
  lineHeight: 'normal',
  size: 'lmedium',
  weight: 'heavy',
})`
  ${margin(0, 5, 0, 0)};
`;

const PanelWarning = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.yellowFavorite,
  lineHeight: 'normal',
  size: 'smedium',
  weight: 'heavy',
}))`
  ${margin(-20, 0, 20, 0)};
`;

const PanelError = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.red,
  lineHeight: 'normal',
  size: 'smedium',
  weight: 'heavy',
}))`
  ${margin(-20, 0, 20, 0)}
`;

const GasTrendHeader = styled(Text).attrs(({ theme: { colors }, color }) => ({
  color: color || colors.appleBlue,
  size: 'smedium',
  weight: 'heavy',
}))`
  ${margin(0, 5, 0, 0)};
`;

const PanelColumn = styled(Column).attrs(() => ({
  justify: 'center',
}))``;

const Label = styled(Text).attrs(({ size }) => ({
  size: size || 'lmedium',
}))`
  ${({ weight }) => fontWithWidth(weight || fonts.weight.semibold)}
`;

const GAS_FEE_INCREMENT = 1;
const MAX_BASE_FEE_RANGE = [1, 3];
const MINER_TIP_RANGE = [1, 2];

export default function FeesPanel({
  currentGasTrend,
  colorForAsset,
  onCustomGasFocus,
}) {
  const {
    selectedGasFee,
    currentBlockParams,
    gasFeeParamsBySpeed,
    updateToCustomGasFee,
    updateGasFeeOption,
    selectedGasFeeOption,
  } = useGas();
  const { navigate } = useNavigation();
  const { isDarkMode } = useTheme();

  const [customMaxPriorityFee, setCustomMaxPriorityFee] = useState(
    selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas?.gwei || 0
  );
  const [customMaxBaseFee, setCustomMaxBaseFee] = useState(
    selectedGasFee?.gasFeeParams?.maxFeePerGas?.gwei || 0
  );
  const [maxPriorityFeeWarning, setMaxPriorityFeeWarning] = useState(null);
  const [maxPriorityFeeError, setMaxPriorityFeeError] = useState(null);

  const [maxBaseFeeWarning, setMaxBaseFeeWarning] = useState(null);
  const [maxBaseFeeError, setMaxBaseFeeError] = useState(null);
  const [feesGweiInputFocused, setFeesGweiInputFocused] = useState(false);

  const maxBaseWarningsStyle = useAnimatedStyle(() => {
    const display = !!maxBaseFeeError || !!maxBaseFeeWarning;
    return {
      transform: [{ scale: display ? 1 : 0 }],
    };
  });

  const maxPriorityWarningsStyle = useAnimatedStyle(() => {
    const display = !!maxPriorityFeeError || !!maxPriorityFeeWarning;
    return {
      transform: [{ scale: display ? 1 : 0 }],
    };
  });

  const selectedOptionIsCustom = useMemo(
    () => selectedGasFee?.option === gasUtils.CUSTOM,
    [selectedGasFee?.option]
  );

  const { maxFee, currentBaseFee, maxBaseFee, maxPriorityFee } = useMemo(() => {
    const maxFee = selectedGasFee?.gasFee?.maxFee?.native?.value?.display || 0;
    const currentBaseFee = currentBlockParams?.baseFeePerGas?.gwei || 0;

    let maxBaseFee;

    if (selectedOptionIsCustom) {
      // block more than 2 decimals on gwei value
      const decimals = Number(customMaxBaseFee) % 1;
      maxBaseFee =
        `${decimals}`.length > 4
          ? parseInt(customMaxBaseFee, 10)
          : customMaxBaseFee;
    } else {
      maxBaseFee = parseInt(
        selectedGasFee?.gasFeeParams?.maxFeePerGas?.gwei || 0,
        10
      );
    }

    let maxPriorityFee;
    if (feesGweiInputFocused) {
      // block more than 2 decimals on gwei value
      const decimals = Number(customMaxPriorityFee) % 1;
      maxPriorityFee =
        `${decimals}`.length > 4
          ? Number(parseFloat(customMaxPriorityFee).toFixed(2))
          : customMaxPriorityFee;
    } else {
      maxPriorityFee =
        selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas?.gwei || 0;
    }
    return { currentBaseFee, maxBaseFee, maxFee, maxPriorityFee };
  }, [
    selectedGasFee,
    currentBlockParams,
    selectedOptionIsCustom,
    feesGweiInputFocused,
    customMaxBaseFee,
    customMaxPriorityFee,
  ]);

  const renderRowLabel = useCallback(
    (label, type, error, warning) => {
      const openGasHelper = () => {
        Keyboard.dismiss();
        navigate(Routes.EXPLAIN_SHEET, {
          currentBaseFee,
          currentGasTrend,
          type,
        });
      };
      let color;
      let text;
      if ((!error && !warning) || !selectedOptionIsCustom) {
        color = isDarkMode
          ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.25)
          : colors.alpha(colors.blueGreyDark, 0.25);
        text = '􀅵';
      } else if (error) {
        color = colors.red;
        text = '􀁟';
      } else {
        color = colors.yellowFavorite;
        text = '􀇿';
      }

      return (
        <PanelColumn>
          <ButtonPressAnimation onPress={openGasHelper}>
            <Row>
              <PanelLabel>
                {`${label} `}
                <Label color={color} size="smedium" weight="bold">
                  {text}
                </Label>
              </PanelLabel>
            </Row>
          </ButtonPressAnimation>
        </PanelColumn>
      );
    },
    [
      currentBaseFee,
      currentGasTrend,
      navigate,
      selectedOptionIsCustom,
      isDarkMode,
    ]
  );

  const formattedBaseFee = useMemo(
    () => `${parseInt(currentBaseFee, 10)} Gwei`,
    [currentBaseFee]
  );

  const handleOnInputFocus = useCallback(() => {
    if (isEmpty(gasFeeParamsBySpeed[gasUtils.CUSTOM])) {
      const gasFeeParams = gasFeeParamsBySpeed[selectedGasFeeOption];
      updateToCustomGasFee({
        ...gasFeeParams,
        option: gasUtils.CUSTOM,
      });
    } else {
      updateGasFeeOption(gasUtils.CUSTOM);
    }
  }, [
    gasFeeParamsBySpeed,
    selectedGasFeeOption,
    updateGasFeeOption,
    updateToCustomGasFee,
  ]);

  const handleFeesGweiInputFocus = useCallback(() => {
    onCustomGasFocus?.();
    handleOnInputFocus();
    const {
      gasFeeParams: { maxFeePerGas, maxPriorityFeePerGas },
    } = selectedGasFee;
    setCustomMaxPriorityFee(maxPriorityFeePerGas?.gwei || 0);
    setCustomMaxBaseFee(parseInt(maxFeePerGas?.gwei || 0));
  }, [onCustomGasFocus, handleOnInputFocus, selectedGasFee]);

  const handleCustomPriorityFeeFocus = useCallback(() => {
    handleOnInputFocus();
    setFeesGweiInputFocused(true);
    handleFeesGweiInputFocus();
  }, [handleFeesGweiInputFocus, handleOnInputFocus]);

  const handleCustomPriorityFeeBlur = useCallback(() => {
    setFeesGweiInputFocused(false);
  }, [setFeesGweiInputFocused]);

  const updateGasFee = useCallback(
    ({ priorityFeePerGas = 0, feePerGas = 0 }) => {
      const maxFeePerGas = selectedGasFee?.gasFeeParams?.maxFeePerGas;
      const maxPriorityFeePerGas =
        selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas;

      const gweiMaxPriorityFeePerGas = Number(maxPriorityFeePerGas?.gwei || 0);
      const gweiMaxFeePerGas = Number(maxFeePerGas?.gwei || 0);

      const newGweiMaxPriorityFeePerGas =
        Math.round((gweiMaxPriorityFeePerGas + priorityFeePerGas) * 100) / 100;
      const newGweiMaxFeePerGas =
        Math.round((gweiMaxFeePerGas + feePerGas) * 100) / 100;

      const newMaxPriorityFeePerGas = parseGasFeeParam(
        gweiToWei(newGweiMaxPriorityFeePerGas)
      );
      const newMaxFeePerGas = parseGasFeeParam(gweiToWei(newGweiMaxFeePerGas));

      if (newMaxPriorityFeePerGas.amount < 0 || newMaxFeePerGas.amount < 0)
        return;

      setCustomMaxPriorityFee(newMaxPriorityFeePerGas?.gwei || 0);
      setCustomMaxBaseFee(parseInt(newMaxFeePerGas?.gwei || 0));

      const newGasParams = {
        ...selectedGasFee.gasFeeParams,
        maxFeePerGas: newMaxFeePerGas,
        maxPriorityFeePerGas: newMaxPriorityFeePerGas,
      };
      updateToCustomGasFee(newGasParams);
    },
    [selectedGasFee.gasFeeParams, updateToCustomGasFee]
  );

  const addMinerTip = useCallback(() => {
    updateGasFee({
      priorityFeePerGas: calculateMinerTipAddDifference(maxPriorityFee),
    });
  }, [updateGasFee, maxPriorityFee]);

  const substMinerTip = useCallback(() => {
    updateGasFee({
      priorityFeePerGas: -calculateMinerTipSubstDifference(maxPriorityFee),
    });
  }, [updateGasFee, maxPriorityFee]);

  const addMaxFee = useCallback(() => {
    updateGasFee({ feePerGas: GAS_FEE_INCREMENT });
  }, [updateGasFee]);

  const substMaxFee = useCallback(
    () => updateGasFee({ feePerGas: -GAS_FEE_INCREMENT }),
    [updateGasFee]
  );

  const onMaxBaseFeeChange = useCallback(
    ({ nativeEvent: { text } }) => {
      text = text || 0;
      const maxFeePerGas = parseGasFeeParam(gweiToWei(text));
      const gweiMaxFeePerGas = maxFeePerGas?.gwei || 0;

      const newGweiMaxFeePerGas = Math.round(gweiMaxFeePerGas * 100) / 100;

      const newMaxFeePerGas = parseGasFeeParam(gweiToWei(newGweiMaxFeePerGas));

      if (newMaxFeePerGas.amount < 0) return;

      setCustomMaxBaseFee(text);

      const newGasParams = {
        ...selectedGasFee.gasFeeParams,
        maxFeePerGas: newMaxFeePerGas,
      };
      updateToCustomGasFee(newGasParams);
    },
    [selectedGasFee.gasFeeParams, updateToCustomGasFee]
  );

  const onMinerTipChange = useCallback(
    ({ nativeEvent: { text } }) => {
      text = text || 0;
      const maxPriorityFeePerGas = parseGasFeeParam(gweiToWei(text));
      const gweiMaxPriorityFeePerGas = maxPriorityFeePerGas?.gwei || 0;

      const newGweiMaxPriorityFeePerGas =
        Math.round(gweiMaxPriorityFeePerGas * 100) / 100;

      const newMaxPriorityFeePerGas = parseGasFeeParam(
        gweiToWei(newGweiMaxPriorityFeePerGas)
      );
      if (newMaxPriorityFeePerGas.amount < 0) return;

      setCustomMaxPriorityFee(text);

      const newGasParams = {
        ...selectedGasFee.gasFeeParams,
        maxPriorityFeePerGas: newMaxPriorityFeePerGas,
      };
      updateToCustomGasFee(newGasParams);
    },
    [selectedGasFee.gasFeeParams, updateToCustomGasFee]
  );

  const renderWarning = useCallback(
    (error, warning) => {
      if (!selectedOptionIsCustom) return;
      return (
        (error && <PanelError>{error}</PanelError>) ||
        (warning && <PanelWarning>{warning}</PanelWarning>)
      );
    },
    [selectedOptionIsCustom]
  );

  useEffect(() => {
    // validate not zero
    if (!maxBaseFee || isZero(maxBaseFee)) {
      setMaxBaseFeeError('1 Gwei to avoid failure');
    } else {
      setMaxBaseFeeError(null);
    }
    if (
      greaterThan(multiply(MAX_BASE_FEE_RANGE[0], currentBaseFee), maxBaseFee)
    ) {
      setMaxBaseFeeWarning('Lower than recommended');
    } else if (
      greaterThan(maxBaseFee, multiply(MAX_BASE_FEE_RANGE[1], currentBaseFee))
    ) {
      setMaxBaseFeeWarning('Higher than necessary');
    } else {
      setMaxBaseFeeWarning(null);
    }
  }, [maxBaseFee, currentBaseFee]);

  useEffect(() => {
    // validate not zero
    if (!maxPriorityFee || isZero(maxPriorityFee)) {
      setMaxPriorityFeeError('1 Gwei to avoid failure');
    } else {
      setMaxPriorityFeeError(null);
    }
    if (
      greaterThan(
        multiply(
          MINER_TIP_RANGE[0],
          gasFeeParamsBySpeed?.normal?.maxPriorityFeePerGas?.gwei
        ),
        maxPriorityFee
      )
    ) {
      setMaxPriorityFeeWarning('Lower than recommended');
    } else if (
      greaterThan(
        maxPriorityFee,
        multiply(
          MINER_TIP_RANGE[1],
          gasFeeParamsBySpeed?.urgent?.maxPriorityFeePerGas?.gwei
        )
      )
    ) {
      setMaxPriorityFeeWarning('Higher than necessary');
    } else {
      setMaxPriorityFeeWarning(null);
    }
  }, [
    gasFeeParamsBySpeed?.urgent?.maxPriorityFeePerGas?.gwei,
    gasFeeParamsBySpeed?.normal?.maxPriorityFeePerGas?.gwei,
    maxPriorityFee,
  ]);

  return (
    <Wrapper>
      <PanelRowThin>
        <PanelColumn />
        <PanelColumn>
          <GasTrendHeader color={gasUtils.GAS_TRENDS[currentGasTrend].color}>
            {gasUtils.GAS_TRENDS[currentGasTrend].label}
          </GasTrendHeader>
        </PanelColumn>
      </PanelRowThin>

      <PanelRow justify="space-between" marginBottom={18}>
        {renderRowLabel(
          'Current Base Fee',
          'currentBaseFee' + upperFirst(currentGasTrend)
        )}
        <PanelColumn>
          <PanelLabel>{formattedBaseFee}</PanelLabel>
        </PanelColumn>
      </PanelRow>

      <MiddlePanelRow>
        {renderRowLabel(
          'Max Base Fee',
          'maxBaseFee',
          maxBaseFeeError,
          maxBaseFeeWarning
        )}
        <PanelColumn>
          <FeesGweiInput
            buttonColor={colorForAsset}
            minusAction={substMaxFee}
            onChange={onMaxBaseFeeChange}
            onPress={handleFeesGweiInputFocus}
            plusAction={addMaxFee}
            testID="max-base-fee-input"
            value={maxBaseFee}
          />
        </PanelColumn>
      </MiddlePanelRow>
      <Animated.View style={maxBaseWarningsStyle}>
        {renderWarning(maxBaseFeeError, maxBaseFeeWarning)}
      </Animated.View>

      <MiddlePanelRow>
        {renderRowLabel(
          'Miner Tip',
          `minerTip`,
          maxPriorityFeeError,
          maxPriorityFeeWarning
        )}
        <PanelColumn>
          <FeesGweiInput
            buttonColor={colorForAsset}
            minusAction={substMinerTip}
            onBlur={handleCustomPriorityFeeBlur}
            onChange={onMinerTipChange}
            onPress={handleCustomPriorityFeeFocus}
            plusAction={addMinerTip}
            testID="max-priority-fee-input"
            value={maxPriorityFee}
          />
        </PanelColumn>
      </MiddlePanelRow>
      <Animated.View style={maxPriorityWarningsStyle}>
        {renderWarning(maxPriorityFeeError, maxPriorityFeeWarning)}
      </Animated.View>

      <PanelRow marginTop={18}>
        <PanelColumn>
          <PanelLabel>Max Transaction Fee</PanelLabel>
        </PanelColumn>
        <PanelColumn>
          <PanelLabel>{maxFee}</PanelLabel>
        </PanelColumn>
      </PanelRow>
    </Wrapper>
  );
}
