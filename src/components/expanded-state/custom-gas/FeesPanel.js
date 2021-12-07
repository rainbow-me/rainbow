import { useNavigation } from '@react-navigation/core';
import { useRoute } from '@react-navigation/native';
import { isEmpty, upperFirst } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, KeyboardAvoidingView } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import styled, { useTheme } from 'styled-components';
import { Alert } from '../../../components/alerts';
import { ButtonPressAnimation } from '../../animations';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
import FeesGweiInput from './FeesGweiInput';
import {
  calculateMinerTipAddDifference,
  calculateMinerTipSubstDifference,
} from '@rainbow-me/helpers/gas';
import {
  add,
  greaterThan,
  isZero,
  multiply,
  toFixedDecimals,
} from '@rainbow-me/helpers/utilities';
import { useGas } from '@rainbow-me/hooks';
import { gweiToWei, parseGasFeeParam } from '@rainbow-me/parsers';
import Routes from '@rainbow-me/routes';
import { fonts, fontWithWidth, margin, padding } from '@rainbow-me/styles';
import { gasUtils } from '@rainbow-me/utils';

const Wrapper = styled(KeyboardAvoidingView)``;
const { CUSTOM, GAS_TRENDS, NORMAL, URGENT } = gasUtils;

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
  ${margin(-15, 0, 20, 0)};
`;

const PanelError = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.red,
  lineHeight: 'normal',
  size: 'smedium',
  weight: 'heavy',
}))`
  ${margin(-15, 0, 20, 0)}
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

const LOWER_THAN_SUGGESTED = 'Lower than suggested';
const HIGHER_THAN_NECESSARY = 'Higher than necessary';

const ALERT_MESSAGE_HIGHER_MINER_TIP_NEEDED =
  'Setting a higher miner tip is recommended to avoid issues.';
const ALERT_MESSAGE_HIGHER_MAX_BASE_FEE_NEEDED =
  'Setting a higher max base fee is recommended to avoid issues.';
const ALERT_MESSAGE_LOWER =
  'Double check that you entered the correct amount—you’re likely paying more than you need to!';
const ALERT_TITLE_HIGHER_MAX_BASE_FEE_NEEDED =
  'Low max base fee–transaction might get stuck!';
const ALERT_TITLE_HIGHER_MINER_TIP_NEEDED =
  'Low miner tip–transaction might get stuck!';
const ALERT_TITLE_LOWER_MAX_BASE_FEE_NEEDED = 'High max base fee!';
const ALERT_TITLE_LOWER_MINER_TIP_NEEDED = 'High miner tip!';

const FOCUS_TO_MAX_BASE_FEE = 'focusToMaxBaseFee';
const FOCUS_TO_MINER_TIP = 'focusToMinerTip';

export default function FeesPanel({
  asset,
  currentGasTrend,
  colorForAsset,
  onCustomGasFocus,
  setCanGoBack,
  validateGasParams,
}) {
  const {
    selectedGasFee,
    currentBlockParams,
    customGasFeeModifiedByUser,
    gasFeeParamsBySpeed,
    updateToCustomGasFee,
    updateGasFeeOption,
  } = useGas();

  const { navigate, dangerouslyGetState } = useNavigation();
  const { colors } = useTheme();

  const { params: { speeds, focusToInput } = {} } = useRoute();
  const maxBaseFeeInputRef = useRef(null);
  const minerTipInputRef = useRef(null);

  const [customFees, setCustomFees] = useState({
    customMaxBaseFee: gasFeeParamsBySpeed?.[CUSTOM]?.maxFeePerGas?.gwei,
    customMaxPriorityFee:
      gasFeeParamsBySpeed?.[CUSTOM]?.maxPriorityFeePerGas?.gwei,
  });

  const [maxPriorityFeeWarning, setMaxPriorityFeeWarning] = useState(null);
  const [maxPriorityFeeError, setMaxPriorityFeeError] = useState(null);

  const [maxBaseFeeWarning, setMaxBaseFeeWarning] = useState(null);
  const [maxBaseFeeError, setMaxBaseFeeError] = useState(null);

  const [userProcededOnWarnings, setUserProcededOnWarnings] = useState(false);

  const { customMaxBaseFee, customMaxPriorityFee } = customFees;
  const trendType = 'currentBaseFee' + upperFirst(currentGasTrend);

  const updatedCustomMaxBaseFee =
    gasFeeParamsBySpeed?.[CUSTOM]?.maxFeePerGas?.gwei;
  const updatedCustomMaxPriorityFee =
    gasFeeParamsBySpeed?.[CUSTOM]?.maxPriorityFeePerGas?.gwei;

  useEffect(() => {
    if (
      !customGasFeeModifiedByUser &&
      updatedCustomMaxBaseFee &&
      updatedCustomMaxPriorityFee
    ) {
      setCustomFees({
        customMaxBaseFee: updatedCustomMaxBaseFee,
        customMaxPriorityFee: updatedCustomMaxPriorityFee,
      });
    }
  }, [
    customGasFeeModifiedByUser,
    updatedCustomMaxBaseFee,
    updatedCustomMaxPriorityFee,
  ]);

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
    () => selectedGasFee?.option === CUSTOM,
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
          ? toFixedDecimals(customMaxBaseFee, 0)
          : customMaxBaseFee;
    } else {
      maxBaseFee = toFixedDecimals(
        selectedGasFee?.gasFeeParams?.maxFeePerGas?.gwei || 0,
        0
      );
    }

    let maxPriorityFee;
    if (selectedOptionIsCustom) {
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
    selectedGasFee?.gasFee?.maxFee?.native?.value?.display,
    selectedGasFee?.gasFeeParams?.maxFeePerGas?.gwei,
    selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas?.gwei,
    currentBlockParams?.baseFeePerGas?.gwei,
    selectedOptionIsCustom,
    customMaxBaseFee,
    customMaxPriorityFee,
  ]);

  const openGasHelper = useCallback(
    type => {
      Keyboard.dismiss();
      navigate(Routes.EXPLAIN_SHEET, {
        currentBaseFee: toFixedDecimals(currentBaseFee, 0),
        currentGasTrend,
        type,
      });
    },
    [currentBaseFee, currentGasTrend, navigate]
  );

  const renderRowLabel = useCallback(
    (label, type, error, warning) => {
      let color;
      let text;
      if ((!error && !warning) || !selectedOptionIsCustom) {
        color = colors.alpha(colors.blueGreyDark, 0.25);
        text = '􀅵';
      } else if (error) {
        color = colors.red;
        text = '􀁟';
      } else {
        color = colors.yellowFavorite;
        text = '􀇿';
      }

      const openHelper = () => openGasHelper(type);

      return (
        <PanelColumn>
          <ButtonPressAnimation onPress={openHelper}>
            <Row>
              <PanelLabel>
                {`${label} `}
                <Label color={color} weight="bold">
                  {text}
                </Label>
              </PanelLabel>
            </Row>
          </ButtonPressAnimation>
        </PanelColumn>
      );
    },
    [colors, openGasHelper, selectedOptionIsCustom]
  );

  const formattedBaseFee = useMemo(
    () => `${toFixedDecimals(currentBaseFee, 0)} Gwei`,
    [currentBaseFee]
  );

  const handleOnInputFocus = useCallback(() => {
    if (isEmpty(gasFeeParamsBySpeed[CUSTOM])) {
      const gasFeeParams = gasFeeParamsBySpeed[URGENT];
      updateToCustomGasFee({
        ...gasFeeParams,
        option: CUSTOM,
      });
    } else {
      updateGasFeeOption(CUSTOM);
    }
  }, [gasFeeParamsBySpeed, updateGasFeeOption, updateToCustomGasFee]);

  const handleFeesGweiInputFocus = useCallback(() => {
    onCustomGasFocus?.();
    handleOnInputFocus();
    const {
      gasFeeParams: { maxFeePerGas, maxPriorityFeePerGas },
    } = selectedGasFee;
    setCustomFees({
      customMaxBaseFee: toFixedDecimals(maxFeePerGas?.gwei || 0, 0),
      customMaxPriorityFee: maxPriorityFeePerGas?.gwei || 0,
    });
  }, [onCustomGasFocus, handleOnInputFocus, selectedGasFee]);

  const handleCustomPriorityFeeFocus = useCallback(() => {
    handleOnInputFocus();
    handleFeesGweiInputFocus();
  }, [handleFeesGweiInputFocus, handleOnInputFocus]);

  const updatePriorityFeePerGas = useCallback(
    priorityFeePerGas => {
      const maxPriorityFeePerGas =
        selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas;

      const gweiMaxPriorityFeePerGas = Number(maxPriorityFeePerGas?.gwei || 0);

      const newGweiMaxPriorityFeePerGas =
        Math.round((gweiMaxPriorityFeePerGas + priorityFeePerGas) * 100) / 100;

      const newMaxPriorityFeePerGas = parseGasFeeParam(
        gweiToWei(newGweiMaxPriorityFeePerGas)
      );

      if (newMaxPriorityFeePerGas.amount < 0) return;

      setCustomFees({
        customMaxBaseFee: selectedGasFee?.gasFeeParams?.maxFeePerGas?.gwei,
        customMaxPriorityFee: newMaxPriorityFeePerGas?.gwei || 0,
      });

      const newGasParams = {
        ...selectedGasFee.gasFeeParams,
        maxPriorityFeePerGas: newMaxPriorityFeePerGas,
      };
      updateToCustomGasFee(newGasParams);
    },
    [selectedGasFee.gasFeeParams, updateToCustomGasFee]
  );

  const updateFeePerGas = useCallback(
    feePerGas => {
      const maxFeePerGas =
        selectedGasFee?.gasFeeParams?.maxFeePerGas?.gwei ?? 0;

      const newGweiMaxFeePerGas = toFixedDecimals(
        add(maxFeePerGas, feePerGas),
        0
      );

      const newMaxFeePerGas = parseGasFeeParam(gweiToWei(newGweiMaxFeePerGas));

      if (newMaxFeePerGas.amount < 0) return;

      setCustomFees({
        customMaxBaseFee: newMaxFeePerGas?.gwei,
        customMaxPriorityFee:
          selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas?.gwei,
      });

      const newGasParams = {
        ...selectedGasFee.gasFeeParams,
        maxFeePerGas: newMaxFeePerGas,
      };
      updateToCustomGasFee(newGasParams);
    },
    [selectedGasFee.gasFeeParams, updateToCustomGasFee]
  );

  const addMinerTip = useCallback(() => {
    minerTipInputRef?.current?.focus();
    updatePriorityFeePerGas(calculateMinerTipAddDifference(maxPriorityFee));
  }, [maxPriorityFee, updatePriorityFeePerGas]);

  const substMinerTip = useCallback(() => {
    minerTipInputRef?.current?.focus();
    updatePriorityFeePerGas(-calculateMinerTipSubstDifference(maxPriorityFee));
  }, [maxPriorityFee, updatePriorityFeePerGas]);

  const addMaxFee = useCallback(() => {
    maxBaseFeeInputRef?.current?.focus();
    updateFeePerGas(GAS_FEE_INCREMENT);
  }, [updateFeePerGas]);

  const substMaxFee = useCallback(() => {
    maxBaseFeeInputRef?.current?.focus();
    updateFeePerGas(-GAS_FEE_INCREMENT);
  }, [updateFeePerGas]);

  const onMaxBaseFeeChange = useCallback(
    ({ nativeEvent: { text } }) => {
      const maxFeePerGasGwei = toFixedDecimals(text || 0, 0);
      const maxFeePerGas = parseGasFeeParam(gweiToWei(maxFeePerGasGwei));

      if (greaterThan(0, maxFeePerGas.amount)) return;

      setCustomFees({
        customMaxBaseFee: text,
        customMaxPriorityFee:
          selectedGasFee.gasFeeParams.maxPriorityFeePerGas.gwei,
      });

      const newGasParams = {
        ...selectedGasFee.gasFeeParams,
        maxFeePerGas,
      };
      updateToCustomGasFee(newGasParams);
    },
    [selectedGasFee.gasFeeParams, updateToCustomGasFee]
  );

  const onMinerTipChange = useCallback(
    ({ nativeEvent: { text } }) => {
      const maxPriorityFeePerGasGwei =
        Math.round(Number(text) * 100) / 100 || 0;

      const maxPriorityFeePerGas = parseGasFeeParam(
        gweiToWei(maxPriorityFeePerGasGwei)
      );

      if (greaterThan(0, maxPriorityFeePerGas.amount)) return;

      // we don't use the round number here, if we did
      // when users type "1." it will default to "1"
      setCustomFees({
        customMaxBaseFee: selectedGasFee?.gasFeeParams?.maxFeePerGas?.gwei,
        customMaxPriorityFee: text,
      });

      const newGasParams = {
        ...selectedGasFee.gasFeeParams,
        maxPriorityFeePerGas,
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
    const navigationRoutes = dangerouslyGetState().routes;
    const lastRoute = navigationRoutes?.[navigationRoutes.length - 1]?.name;
    if (lastRoute === 'ExplainSheet') {
      navigate(Routes.EXPLAIN_SHEET, {
        currentBaseFee: toFixedDecimals(currentBaseFee, 0),
        currentGasTrend,
        type: trendType,
      });
    }
  }, [
    currentBaseFee,
    currentGasTrend,
    dangerouslyGetState,
    navigate,
    trendType,
  ]);

  useEffect(() => {
    // validate not zero
    if (!maxBaseFee || isZero(maxBaseFee) || greaterThan(1, maxBaseFee)) {
      setMaxBaseFeeError('1 Gwei to avoid failure');
    } else {
      setMaxBaseFeeError(null);
    }
    const maxBaseFeeToValidate = IS_TESTING === 'true' ? 100 : currentBaseFee;
    if (
      greaterThan(
        multiply(MAX_BASE_FEE_RANGE[0], maxBaseFeeToValidate),
        maxBaseFee
      )
    ) {
      setMaxBaseFeeWarning(LOWER_THAN_SUGGESTED);
    } else if (
      greaterThan(
        maxBaseFee,
        multiply(MAX_BASE_FEE_RANGE[1], maxBaseFeeToValidate)
      )
    ) {
      setMaxBaseFeeWarning(HIGHER_THAN_NECESSARY);
    } else {
      setMaxBaseFeeWarning(null);
    }
  }, [maxBaseFee, currentBaseFee]);

  useEffect(() => {
    // validate not zero
    if (!maxPriorityFee) {
      setMaxPriorityFeeError('0 Gwei to avoid failure');
    } else {
      setMaxPriorityFeeError(null);
    }
    if (
      greaterThan(
        multiply(
          MINER_TIP_RANGE[0],
          IS_TESTING === 'true'
            ? 1
            : gasFeeParamsBySpeed?.[NORMAL]?.maxPriorityFeePerGas?.gwei
        ),
        maxPriorityFee
      )
    ) {
      setMaxPriorityFeeWarning(LOWER_THAN_SUGGESTED);
    } else if (
      greaterThan(
        maxPriorityFee,
        multiply(
          MINER_TIP_RANGE[1],
          IS_TESTING === 'true'
            ? 1
            : gasFeeParamsBySpeed?.[URGENT]?.maxPriorityFeePerGas?.gwei
        )
      )
    ) {
      setMaxPriorityFeeWarning(HIGHER_THAN_NECESSARY);
    } else {
      setMaxPriorityFeeWarning(null);
    }
  }, [gasFeeParamsBySpeed, maxPriorityFee]);

  const alertMaxBaseFee = useCallback(() => {
    const highAlert = maxBaseFeeWarning === HIGHER_THAN_NECESSARY;
    Alert({
      buttons: [
        {
          onPress: () => {
            setUserProcededOnWarnings(true);
            setCanGoBack?.(true);
          },
          text: 'Proceed Anyway',
        },
        {
          onPress: () => {
            navigate(Routes.CUSTOM_GAS_SHEET, {
              asset,
              focusToInput: FOCUS_TO_MAX_BASE_FEE,
              speeds: speeds ?? gasUtils.GasSpeedOrder,
              type: 'custom_gas',
            });
          },
          style: 'cancel',
          text: 'Edit Max Base Fee',
        },
      ],
      message: highAlert
        ? ALERT_MESSAGE_LOWER
        : ALERT_MESSAGE_HIGHER_MAX_BASE_FEE_NEEDED,
      title: highAlert
        ? ALERT_TITLE_LOWER_MAX_BASE_FEE_NEEDED
        : ALERT_TITLE_HIGHER_MAX_BASE_FEE_NEEDED,
    });
  }, [asset, maxBaseFeeWarning, navigate, setCanGoBack, speeds]);

  const alertMaxPriority = useCallback(() => {
    const highAlert = maxPriorityFeeWarning === HIGHER_THAN_NECESSARY;
    Alert({
      buttons: [
        {
          onPress: () => {
            setUserProcededOnWarnings(true);
            setCanGoBack?.(true);
          },
          text: 'Proceed Anyway',
        },
        {
          onPress: () => {
            navigate(Routes.CUSTOM_GAS_SHEET, {
              asset,
              focusToInput: FOCUS_TO_MINER_TIP,
              speeds: speeds ?? gasUtils.GasSpeedOrder,
              type: 'custom_gas',
            });
          },
          style: 'cancel',
          text: 'Edit Miner Tip',
        },
      ],
      message: highAlert
        ? ALERT_MESSAGE_LOWER
        : ALERT_MESSAGE_HIGHER_MINER_TIP_NEEDED,
      title: highAlert
        ? ALERT_TITLE_LOWER_MINER_TIP_NEEDED
        : ALERT_TITLE_HIGHER_MINER_TIP_NEEDED,
    });
  }, [asset, maxPriorityFeeWarning, navigate, setCanGoBack, speeds]);

  validateGasParams.current = () => validateParams();

  const validateParams = useCallback(() => {
    if (userProcededOnWarnings) return;
    const maxBaseValidated = !maxBaseFeeError && !maxBaseFeeWarning;
    const maxPriorityValidated = !maxPriorityFeeError && !maxPriorityFeeWarning;
    if (!maxBaseValidated) {
      alertMaxBaseFee();
    } else if (!maxPriorityValidated) {
      alertMaxPriority();
    }
  }, [
    alertMaxBaseFee,
    alertMaxPriority,
    maxBaseFeeError,
    maxBaseFeeWarning,
    maxPriorityFeeError,
    maxPriorityFeeWarning,
    userProcededOnWarnings,
  ]);

  useEffect(() => {
    const maxBaseValidated = !maxBaseFeeError && !maxBaseFeeWarning;
    const maxPriorityValidated = !maxPriorityFeeError && !maxPriorityFeeWarning;
    if (
      !userProcededOnWarnings &&
      (!maxBaseValidated || !maxPriorityValidated)
    ) {
      setCanGoBack(false);
    } else {
      setCanGoBack(true);
    }
  }, [
    alertMaxBaseFee,
    alertMaxPriority,
    maxBaseFeeError,
    maxBaseFeeWarning,
    maxPriorityFeeError,
    maxPriorityFeeWarning,
    setCanGoBack,
    userProcededOnWarnings,
  ]);

  useEffect(() => {
    return function validate() {
      validateGasParams.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTimeout(() => {
      if (focusToInput === FOCUS_TO_MAX_BASE_FEE) {
        maxBaseFeeInputRef?.current?.focus();
      } else if (focusToInput === FOCUS_TO_MINER_TIP) {
        minerTipInputRef?.current?.focus();
      }
    }, 500);
  }, [focusToInput]);

  return (
    <Wrapper>
      <PanelRowThin>
        <PanelColumn />
        <PanelColumn>
          <GasTrendHeader color={GAS_TRENDS[currentGasTrend].color}>
            {GAS_TRENDS[currentGasTrend].label}
          </GasTrendHeader>
        </PanelColumn>
      </PanelRowThin>

      <PanelRow justify="space-between" marginBottom={18}>
        {renderRowLabel('Current base fee', trendType)}
        <PanelColumn>
          <PanelLabel>{formattedBaseFee}</PanelLabel>
        </PanelColumn>
      </PanelRow>

      <MiddlePanelRow>
        {renderRowLabel(
          'Max base fee',
          'maxBaseFee',
          maxBaseFeeError,
          maxBaseFeeWarning
        )}
        <PanelColumn>
          <FeesGweiInput
            buttonColor={colorForAsset}
            inputRef={maxBaseFeeInputRef}
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
          'Miner tip',
          `minerTip`,
          maxPriorityFeeError,
          maxPriorityFeeWarning
        )}
        <PanelColumn>
          <FeesGweiInput
            buttonColor={colorForAsset}
            inputRef={minerTipInputRef}
            minusAction={substMinerTip}
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

      <PanelRow marginTop={15}>
        <PanelColumn>
          <PanelLabel>Max transaction fee</PanelLabel>
        </PanelColumn>
        <PanelColumn>
          <PanelLabel>{maxFee}</PanelLabel>
        </PanelColumn>
      </PanelRow>
    </Wrapper>
  );
}
