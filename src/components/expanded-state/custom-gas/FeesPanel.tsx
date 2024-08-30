import lang from 'i18n-js';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { upperFirst } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { InteractionManager, Keyboard, KeyboardAvoidingView } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import { Alert } from '../../alerts';
import { useTheme } from '../../../theme/ThemeContext';
import { ButtonPressAnimation } from '../../animations';
import FeesGweiInput from './FeesGweiInput';
import { calculateMinerTipAddDifference, calculateMinerTipSubstDifference } from '@/helpers/gas';
import { add, greaterThan, isZero, lessThan, multiply, toFixedDecimals } from '@/helpers/utilities';
import { useFeesPanelInputRefs, useGas, usePrevious, useTimeout } from '@/hooks';
import { gweiToWei, parseGasFeeParam } from '@/parsers';
import Routes from '@/navigation/routesNames';
import { gasUtils } from '@/utils';
import { Box, Inline, Inset, Row, Rows, Text } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { getNetworkObj } from '@/networks';

const MAX_TEXT_WIDTH = 210;
const { CUSTOM, GAS_TRENDS, NORMAL, URGENT, FLASHBOTS_MIN_TIP } = gasUtils;

const GAS_FEE_INCREMENT = 3;
const GAS_FEE_L2_INCREMENT = 0.02;
const MAX_BASE_FEE_RANGE = [1, 3];
const MINER_TIP_RANGE = [1, 2];

const WARNING_SEPARATOR = '·';
const FOCUS_TO_MAX_BASE_FEE = 'focusToMaxBaseFee';
const FOCUS_TO_MINER_TIP = 'focusToMinerTip';
const MINER_TIP_TYPE = 'minerTip';
const MAX_BASE_FEE_TYPE = 'maxBaseFee';
const HIGH_ALERT = 'HIGH_ALERT';
const LOW_ALERT = 'LOW_ALERT';

type FeesPanelProps = {
  currentGasTrend: keyof typeof GAS_TRENDS;
  colorForAsset: string;
  setCanGoBack: React.Dispatch<React.SetStateAction<boolean>>;
  validateGasParams: React.MutableRefObject<(callback?: () => void) => void | undefined>;
  openCustomOptions: (focusTo: string) => void;
};

type AlertInfo = {
  type: typeof LOW_ALERT | typeof HIGH_ALERT;
  message: string;
} | null;

export default function FeesPanel({ currentGasTrend, colorForAsset, setCanGoBack, validateGasParams, openCustomOptions }: FeesPanelProps) {
  const { selectedGasFee, currentBlockParams, customGasFeeModifiedByUser, gasFeeParamsBySpeed, updateToCustomGasFee, txNetwork } = useGas();

  const { navigate, getState: dangerouslyGetState } = useNavigation();
  const { colors } = useTheme();

  const {
    // @ts-expect-error ts-migrate(2339)
    params: { type, focusTo, flashbotTransaction = false },
  } = useRoute();

  const isFocused = useIsFocused();
  const prevIsFocused = usePrevious(isFocused);
  const { setLastFocusedInputHandle, maxBaseFieldRef, minerTipFieldRef, triggerFocus } = useFeesPanelInputRefs();

  // had to add this for actions happening on the gas speed button
  if (prevIsFocused && !isFocused) {
    Keyboard.dismiss();
  }

  const [customFees, setCustomFees] = useState({
    customMaxBaseFee: gasFeeParamsBySpeed?.[CUSTOM]?.maxBaseFee?.gwei,
    customMaxPriorityFee: gasFeeParamsBySpeed?.[CUSTOM]?.maxPriorityFeePerGas?.gwei,
  });
  const [startPriorityFeeTimeout, stopPriorityFeeTimeout] = useTimeout();
  const [startBaseFeeTimeout, stopBaseFeeTimeout] = useTimeout();

  const isL2 = getNetworkObj(txNetwork)?.networkType === 'layer2';

  const [maxPriorityFeeWarning, setMaxPriorityFeeWarning] = useState<AlertInfo>(null);
  const [maxPriorityFeeError, setMaxPriorityFeeError] = useState<AlertInfo>(null);

  const [maxBaseFeeWarning, setMaxBaseFeeWarning] = useState<AlertInfo>(null);
  const [maxBaseFeeError, setMaxBaseFeeError] = useState<AlertInfo>(null);

  const [userProceededOnWarnings, setUserProcededOnWarnings] = useState(false);

  const { customMaxBaseFee, customMaxPriorityFee } = customFees;
  const trendType = 'currentBaseFee' + upperFirst(currentGasTrend);

  const updatedCustomMaxBaseFee = gasFeeParamsBySpeed?.[CUSTOM]?.maxBaseFee?.gwei;
  const updatedCustomMaxPriorityFee = gasFeeParamsBySpeed?.[CUSTOM]?.maxPriorityFeePerGas?.gwei;

  useEffect(() => {
    if (!customGasFeeModifiedByUser && updatedCustomMaxBaseFee && updatedCustomMaxPriorityFee) {
      setCustomFees({
        customMaxBaseFee: updatedCustomMaxBaseFee,
        customMaxPriorityFee: updatedCustomMaxPriorityFee,
      });
    }
  }, [customGasFeeModifiedByUser, updatedCustomMaxBaseFee, updatedCustomMaxPriorityFee]);

  const selectedOptionIsCustom = useMemo(() => selectedGasFee?.option === CUSTOM, [selectedGasFee?.option]);

  const { maxFee, currentBaseFee, maxBaseFee, maxPriorityFee } = useMemo(() => {
    const maxFee = selectedGasFee?.gasFee?.maxFee?.native?.value?.display;
    const currentBaseFee = currentBlockParams?.baseFeePerGas?.gwei;
    const maxBaseFee = selectedOptionIsCustom
      ? customMaxBaseFee
      : toFixedDecimals(selectedGasFee?.gasFeeParams?.maxBaseFee?.gwei || 0, isL2 ? 3 : 0);

    const maxPriorityFee = selectedOptionIsCustom ? customMaxPriorityFee : selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas?.gwei;

    return { currentBaseFee, maxBaseFee, maxFee, maxPriorityFee };
  }, [
    selectedGasFee?.gasFee?.maxFee?.native?.value?.display,
    selectedGasFee?.gasFeeParams?.maxBaseFee?.gwei,
    selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas?.gwei,
    currentBlockParams?.baseFeePerGas?.gwei,
    selectedOptionIsCustom,
    customMaxBaseFee,
    isL2,
    customMaxPriorityFee,
  ]);

  const openGasHelper = useCallback(
    (type: string) => {
      Keyboard.dismiss();
      navigate(Routes.EXPLAIN_SHEET, {
        currentBaseFee: toFixedDecimals(currentBaseFee, isL2 ? 3 : 0),
        currentGasTrend,
        type,
      });
    },
    [currentBaseFee, currentGasTrend, isL2, navigate]
  );

  const renderRowLabel = useCallback(
    (label: string, type: string, error?: AlertInfo, warning?: AlertInfo) => {
      let color;
      let text;
      if ((!error && !warning) || !selectedOptionIsCustom) {
        color = colors.alpha(colors.blueGreyDark, 0.25);
        text = '􀅵';
      } else if (error) {
        color = colors.red;
        text = '􀇿';
      } else {
        color = colors.yellowFavorite;
        text = '􀇿';
      }

      const openHelper = () => openGasHelper(type);

      return (
        <Box
          as={ButtonPressAnimation}
          paddingVertical="8px"
          marginVertical="-8px"
          // @ts-ignore overloaded props
          onPress={openHelper}
          backgroundColor="accent"
          style={{ maxWidth: 175 }}
        >
          <Inline horizontalSpace="4px" alignVertical="center">
            <Text color="primary (Deprecated)" size="16px / 22px (Deprecated)" weight="heavy" numberOfLines={2}>
              {`${label} `}
              <Text size="icon 16px" color={{ custom: color }} weight="bold" numberOfLines={1}>
                {text}
              </Text>
            </Text>
            <Box marginBottom={IS_ANDROID ? '-4px' : undefined}></Box>
          </Inline>
        </Box>
      );
    },
    [colors, openGasHelper, selectedOptionIsCustom]
  );

  const formattedBaseFee = useMemo(() => {
    if (lessThan(currentBaseFee, 1)) {
      return `< 1 Gwei`;
    }

    return `${toFixedDecimals(currentBaseFee, 0)} Gwei`;
  }, [currentBaseFee]);

  const handleMaxBaseInputGweiPress = useCallback(
    () => setLastFocusedInputHandle(maxBaseFieldRef),
    [maxBaseFieldRef, setLastFocusedInputHandle]
  );

  const handleMinerTipInputGweiPress = useCallback(
    () => setLastFocusedInputHandle(minerTipFieldRef),
    [minerTipFieldRef, setLastFocusedInputHandle]
  );

  const updatePriorityFeePerGas = useCallback(
    (priorityFeePerGas: number) => {
      setLastFocusedInputHandle(minerTipFieldRef);
      const maxPriorityFeePerGas = selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas;

      const gweiMaxPriorityFeePerGas = Number(maxPriorityFeePerGas?.gwei || 0);

      const newGweiMaxPriorityFeePerGas = Math.round((gweiMaxPriorityFeePerGas + priorityFeePerGas) * 100) / 100;

      const newMaxPriorityFeePerGas = parseGasFeeParam(gweiToWei(newGweiMaxPriorityFeePerGas));

      if (flashbotTransaction && greaterThan(FLASHBOTS_MIN_TIP, newMaxPriorityFeePerGas.gwei)) return;

      if (greaterThan(0, newMaxPriorityFeePerGas.amount)) return;

      setCustomFees({
        customMaxBaseFee: selectedGasFee?.gasFeeParams?.maxBaseFee?.gwei,
        customMaxPriorityFee: newMaxPriorityFeePerGas?.gwei,
      });

      const newGasParams = {
        ...selectedGasFee.gasFeeParams,
        maxPriorityFeePerGas: newMaxPriorityFeePerGas,
      };
      updateToCustomGasFee(newGasParams);
    },
    [flashbotTransaction, minerTipFieldRef, selectedGasFee.gasFeeParams, setLastFocusedInputHandle, updateToCustomGasFee]
  );

  const updateFeePerGas = useCallback(
    (feePerGas: number) => {
      setLastFocusedInputHandle(maxBaseFieldRef);
      const maxBaseFee = selectedGasFee?.gasFeeParams?.maxBaseFee?.gwei ?? 0;

      const newGweiMaxBaseFee = toFixedDecimals(add(maxBaseFee, feePerGas), isL2 ? 3 : 0);

      const newMaxBaseFee = parseGasFeeParam(gweiToWei(newGweiMaxBaseFee));
      if (greaterThan(0, newMaxBaseFee.amount)) return;

      setCustomFees({
        customMaxBaseFee: newMaxBaseFee?.gwei,
        customMaxPriorityFee: selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas?.gwei,
      });

      const newGasParams = {
        ...selectedGasFee.gasFeeParams,
        maxBaseFee: newMaxBaseFee,
      };
      updateToCustomGasFee(newGasParams);
    },
    [isL2, maxBaseFieldRef, selectedGasFee.gasFeeParams, setLastFocusedInputHandle, updateToCustomGasFee]
  );

  const addMinerTip = useCallback(() => {
    updatePriorityFeePerGas(calculateMinerTipAddDifference(maxPriorityFee, txNetwork));
  }, [maxPriorityFee, txNetwork, updatePriorityFeePerGas]);

  const substMinerTip = useCallback(() => {
    updatePriorityFeePerGas(-calculateMinerTipSubstDifference(maxPriorityFee, txNetwork));
  }, [maxPriorityFee, txNetwork, updatePriorityFeePerGas]);

  const addMaxFee = useCallback(() => {
    updateFeePerGas(isL2 ? GAS_FEE_L2_INCREMENT : GAS_FEE_INCREMENT);
  }, [isL2, updateFeePerGas]);

  const substMaxFee = useCallback(() => {
    updateFeePerGas(isL2 ? -GAS_FEE_L2_INCREMENT : -GAS_FEE_INCREMENT);
  }, [isL2, updateFeePerGas]);

  const onMaxBaseFeeChange = useCallback(
    (text: string) => {
      const maxBaseFee = parseGasFeeParam(gweiToWei(text || 0));

      if (greaterThan(0, maxBaseFee.amount)) return;

      setCustomFees({
        customMaxBaseFee: text,
        customMaxPriorityFee: selectedGasFee.gasFeeParams.maxPriorityFeePerGas.gwei,
      });

      const newGasParams = {
        ...selectedGasFee.gasFeeParams,
        maxBaseFee,
      };
      updateToCustomGasFee(newGasParams);
    },
    [selectedGasFee.gasFeeParams, updateToCustomGasFee]
  );

  const onMinerTipChange = useCallback(
    (text: string) => {
      const maxPriorityFeePerGas = parseGasFeeParam(gweiToWei(text || 0));

      if (greaterThan(0, maxPriorityFeePerGas.amount)) return;

      setCustomFees({
        customMaxBaseFee: selectedGasFee?.gasFeeParams?.maxBaseFee?.gwei,
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
    (error: AlertInfo, warning: AlertInfo) => {
      if (!selectedOptionIsCustom) return;
      const errorMessage = error?.message;
      const warningMessage = warning?.message;

      const errorPrefix = errorMessage?.substring(0, errorMessage?.indexOf(WARNING_SEPARATOR));
      let errorSuffix = errorMessage?.substring(errorMessage?.indexOf(WARNING_SEPARATOR), errorMessage?.length);

      const warningPrefix = warningMessage?.substring(0, warningMessage?.indexOf(WARNING_SEPARATOR));
      const warningSuffix = warningMessage?.substring(warningMessage?.indexOf(WARNING_SEPARATOR), warningMessage?.length);

      if (errorSuffix === WARNING_SEPARATOR + ' Enter an amount') {
        errorSuffix = 'Enter an amount';
      }

      return (
        (error && (
          <Box paddingTop="8px" style={{ maxWidth: MAX_TEXT_WIDTH }}>
            <Text color={{ custom: colors.red }} size="16px / 22px (Deprecated)" weight="heavy" numberOfLines={1}>
              {errorPrefix}
              <Text color={{ custom: colors.alpha(colors.blueGreyDark, 0.5) }} size="16px / 22px (Deprecated)" weight="bold">
                {errorSuffix}
              </Text>
            </Text>
          </Box>
        )) ||
        (warning && (
          <Box paddingTop="8px" style={{ maxWidth: MAX_TEXT_WIDTH }}>
            <Text color={{ custom: colors.yellowFavorite }} size="16px / 22px (Deprecated)" weight="heavy">
              {warningPrefix}
              <Text color={{ custom: colors.alpha(colors.blueGreyDark, 0.5) }} size="16px / 22px (Deprecated)" weight="heavy">
                {warningSuffix}
              </Text>
            </Text>
          </Box>
        ))
      );
    },
    [colors, selectedOptionIsCustom]
  );

  const onAlertProceeded = useCallback(
    (callback?: () => void) => {
      setUserProcededOnWarnings(true);
      setCanGoBack?.(true);
      callback?.();
    },
    [setCanGoBack]
  );

  useEffect(() => {
    const navigationRoutes = dangerouslyGetState()?.routes;
    const lastRouteName = navigationRoutes?.[navigationRoutes.length - 1]?.name;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const lastRouteType = navigationRoutes?.[navigationRoutes.length - 1]?.params?.type;
    if (lastRouteName === 'ExplainSheet' && lastRouteType.includes('currentBaseFee')) {
      navigate(Routes.EXPLAIN_SHEET, {
        currentBaseFee: toFixedDecimals(currentBaseFee, 0),
        currentGasTrend,
        type: trendType,
      });
    }
  }, [currentBaseFee, currentGasTrend, dangerouslyGetState, navigate, trendType, type]);

  useEffect(() => {
    stopBaseFeeTimeout();
    startBaseFeeTimeout(async () => {
      // there's an e2e modifying this panel so I needed values that aren't dependent on the network conditions
      const maxBaseFeeToValidate = IS_TESTING === 'true' ? 100 : currentBaseFee;

      if (!maxBaseFee || isZero(maxBaseFee) || greaterThan(multiply(0.1, maxBaseFeeToValidate), maxBaseFee)) {
        setMaxBaseFeeError({
          message: lang.t('gas.max_base_fee_too_low_error'),
          type: LOW_ALERT,
        });
      } else {
        setMaxBaseFeeError(null);
      }
      if (greaterThan(multiply(MAX_BASE_FEE_RANGE[0], maxBaseFeeToValidate), maxBaseFee)) {
        setMaxBaseFeeWarning({
          message: lang.t('gas.lower_than_suggested'),
          type: LOW_ALERT,
        });
      } else {
        setMaxBaseFeeWarning(null);
      }
    });
  }, [maxBaseFee, currentBaseFee, stopBaseFeeTimeout, startBaseFeeTimeout]);

  useEffect(() => {
    stopPriorityFeeTimeout();
    startPriorityFeeTimeout(() => {
      if (!maxPriorityFee || isZero(maxPriorityFee) || greaterThan(isL2 ? 0.0001 : 1, maxPriorityFee)) {
        setMaxPriorityFeeError({
          message: lang.t('gas.tip_too_low_error'),
          type: LOW_ALERT,
        });
      } else {
        setMaxPriorityFeeError(null);
      }
      // there's an e2e modifying this panel so I needed values that aren't dependant on the network conditions
      if (
        greaterThan(
          multiply(MINER_TIP_RANGE[0], IS_TESTING === 'true' ? 1 : gasFeeParamsBySpeed?.[NORMAL]?.maxPriorityFeePerGas?.gwei),
          maxPriorityFee
        )
      ) {
        setMaxPriorityFeeWarning({
          message: lang.t('gas.lower_than_suggested'),
          type: LOW_ALERT,
        });
      } else if (
        // there's an e2e modifying this panel so I needed values that aren't dependant on the network conditions
        greaterThan(
          maxPriorityFee,
          multiply(MINER_TIP_RANGE[1], IS_TESTING === 'true' ? 1 : gasFeeParamsBySpeed?.[URGENT]?.maxPriorityFeePerGas?.gwei)
        )
      ) {
        setMaxPriorityFeeWarning({
          message: lang.t('gas.higher_than_suggested'),
          type: HIGH_ALERT,
        });
      } else {
        setMaxPriorityFeeWarning(null);
      }
    });
  }, [gasFeeParamsBySpeed, isL2, maxPriorityFee, startPriorityFeeTimeout, stopPriorityFeeTimeout]);

  const alertMaxBaseFee = useCallback(
    (callback?: () => void) => {
      Alert({
        buttons: [
          {
            onPress: () => onAlertProceeded(callback),
            text: lang.t('gas.proceed_anyway'),
          },
          {
            onPress: () => openCustomOptions(FOCUS_TO_MAX_BASE_FEE),
            style: 'cancel',
            text: lang.t('gas.edit_max_bass_fee'),
          },
        ],
        message: lang.t('gas.alert_message_higher_max_base_fee_needed'),
        title: lang.t('gas.alert_title_higher_max_base_fee_needed'),
      });
    },
    [onAlertProceeded, openCustomOptions]
  );

  const alertMaxPriority = useCallback(
    (callback?: () => void) => {
      const highAlert = maxPriorityFeeWarning?.type === HIGH_ALERT;
      Alert({
        buttons: [
          {
            onPress: () => onAlertProceeded(callback),
            text: lang.t('gas.proceed_anyway'),
          },
          {
            onPress: () => openCustomOptions(FOCUS_TO_MINER_TIP),
            style: 'cancel',
            text: lang.t('gas.edit_miner_tip'),
          },
        ],
        message: highAlert ? lang.t('gas.alert_message_lower') : lang.t('gas.alert_message_higher_miner_tip_needed'),
        title: highAlert ? lang.t('gas.alert_title_lower_miner_tip_needed') : lang.t('gas.alert_title_higher_miner_tip_needed'),
      });
    },
    [maxPriorityFeeWarning, onAlertProceeded, openCustomOptions]
  );

  validateGasParams.current = (callback?: () => void) => validateParams(callback);

  const validateParams = useCallback(
    (callback?: () => void) => {
      if (userProceededOnWarnings || !selectedOptionIsCustom) return;
      const maxBaseValidated = !maxBaseFeeError && !maxBaseFeeWarning;
      const maxPriorityValidated = !maxPriorityFeeError && !maxPriorityFeeWarning;
      if (!maxBaseValidated) {
        alertMaxBaseFee(callback);
      } else if (!maxPriorityValidated) {
        alertMaxPriority(callback);
      }
    },
    [
      alertMaxBaseFee,
      alertMaxPriority,
      maxBaseFeeError,
      maxBaseFeeWarning,
      maxPriorityFeeError,
      maxPriorityFeeWarning,
      selectedOptionIsCustom,
      userProceededOnWarnings,
    ]
  );

  useEffect(() => {
    const maxBaseValidated = !maxBaseFeeError && !maxBaseFeeWarning;
    const maxPriorityValidated = !maxPriorityFeeError && !maxPriorityFeeWarning;
    if (!userProceededOnWarnings && selectedOptionIsCustom && (!maxBaseValidated || !maxPriorityValidated)) {
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
    selectedOptionIsCustom,
    setCanGoBack,
    userProceededOnWarnings,
  ]);

  useEffect(() => {
    return function validate() {
      validateGasParams?.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const focus = async () => {
      if (focusTo === FOCUS_TO_MINER_TIP) {
        setLastFocusedInputHandle(minerTipFieldRef);
      } else {
        setLastFocusedInputHandle(maxBaseFieldRef);
      }
      InteractionManager.runAfterInteractions(() => {
        triggerFocus();
      });
    };
    focus();
  }, [focusTo, maxBaseFieldRef, minerTipFieldRef, setLastFocusedInputHandle, triggerFocus]);

  return (
    <Box as={KeyboardAvoidingView}>
      <Inset bottom="12px">
        <Inline alignHorizontal="right">
          <Box
            as={ButtonPressAnimation}
            paddingVertical="8px"
            marginVertical="-8px"
            // @ts-ignore overloaded props

            onPress={() => openGasHelper(trendType)}
            scaleTo={1}
          >
            <Text
              size="16px / 22px (Deprecated)"
              weight="heavy"
              color={{
                custom: GAS_TRENDS[currentGasTrend]?.color || colors.appleBlue,
              }}
            >
              {GAS_TRENDS[currentGasTrend]?.label}
            </Text>
          </Box>
        </Inline>
      </Inset>
      <Rows space={{ custom: 16 }}>
        <Row>
          <Box paddingBottom={{ custom: 14 }}>
            <Inline alignVertical="center" alignHorizontal="justify">
              <Box>{renderRowLabel(lang.t('gas.current_base_fee'), trendType)}</Box>
              <Box
                as={ButtonPressAnimation}
                // @ts-ignore overloaded props

                onPress={() => openGasHelper(trendType)}
                scaleTo={1}
              >
                <Text color="primary (Deprecated)" size="16px / 22px (Deprecated)" weight="heavy">
                  {formattedBaseFee}
                </Text>
              </Box>
            </Inline>
          </Box>
        </Row>

        <Row>
          <Box>
            <Inline alignVertical="center" alignHorizontal="justify">
              <Box>
                {renderRowLabel(lang.t('gas.max_base_fee'), MAX_BASE_FEE_TYPE, maxBaseFeeError, maxBaseFeeWarning)}
                {renderWarning(maxBaseFeeError, maxBaseFeeWarning)}
              </Box>
              <Box marginRight="-5px (Deprecated)">
                <FeesGweiInput
                  buttonColor={colorForAsset}
                  inputRef={maxBaseFieldRef}
                  minusAction={substMaxFee}
                  onChange={onMaxBaseFeeChange}
                  onPress={handleMaxBaseInputGweiPress}
                  onBlur={() => null}
                  plusAction={addMaxFee}
                  testID="max-base-fee-input"
                  value={maxBaseFee}
                  editable
                />
              </Box>
            </Inline>
          </Box>
        </Row>

        <Row>
          <Box>
            <Inline alignVertical="center" alignHorizontal="justify">
              <Box>
                {renderRowLabel(lang.t('gas.miner_tip'), MINER_TIP_TYPE, maxPriorityFeeError, maxPriorityFeeWarning)}
                {renderWarning(maxPriorityFeeError, maxPriorityFeeWarning)}
              </Box>
              <Box marginRight="-5px (Deprecated)">
                <FeesGweiInput
                  buttonColor={colorForAsset}
                  editable={!flashbotTransaction}
                  inputRef={minerTipFieldRef}
                  minusAction={substMinerTip}
                  onChange={onMinerTipChange}
                  onPress={handleMinerTipInputGweiPress}
                  plusAction={addMinerTip}
                  testID="max-priority-fee-input"
                  value={maxPriorityFee}
                  onBlur={() => null}
                />
              </Box>
            </Inline>
          </Box>
        </Row>

        <Row>
          <Box paddingTop={{ custom: 14 }}>
            <Inline alignVertical="center" alignHorizontal="justify">
              <Text color="primary (Deprecated)" size="16px / 22px (Deprecated)" weight="heavy">
                {lang.t('gas.max_transaction_fee')}
              </Text>
              <Text color="primary (Deprecated)" size="16px / 22px (Deprecated)" weight="heavy">
                {maxFee}
              </Text>
            </Inline>
          </Box>
        </Row>
      </Rows>
    </Box>
  );
}
