import {
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { upperFirst } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  InteractionManager,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
// @ts-expect-error
import { IS_TESTING } from 'react-native-dotenv';
import { Alert } from '../../alerts';
import { useTheme } from '../../../theme/ThemeContext';
import { ButtonPressAnimation } from '../../animations';
import FeesGweiInput from './FeesGweiInput';
import {
  calculateMinerTipAddDifference,
  calculateMinerTipSubstDifference,
} from '@/helpers/gas';
import {
  add,
  greaterThan,
  isZero,
  multiply,
  toFixedDecimals,
} from '@/helpers/utilities';
import {
  useFeesPanelInputRefs,
  useGas,
  usePrevious,
  useTimeout,
} from '@/hooks';
import { gweiToWei, parseGasFeeParam } from '@/parsers';
import Routes from '@/navigation/routesNames';
import { gasUtils } from '@/utils';
import {
  Box,
  Inline,
  Inset,
  Row,
  Rows,
  Text as NewText,
} from '@/design-system';

const { CUSTOM, GAS_TRENDS, NORMAL, URGENT, FLASHBOTS_MIN_TIP } = gasUtils;

const GAS_FEE_INCREMENT = 3;
const MAX_BASE_FEE_RANGE = [1, 3];
const MINER_TIP_RANGE = [1, 2];

const WARNING_SEPARATOR = '·';
const LOWER_THAN_SUGGESTED = 'Low ' + WARNING_SEPARATOR + ' may get stuck';
const HIGHER_THAN_NECESSARY = 'High ' + WARNING_SEPARATOR + ' overpaying';

const MAX_BASE_FEE_TOO_LOW_ERROR =
  'Low ' + WARNING_SEPARATOR + ' likely to fail';
const TIP_TOO_LOW_ERROR = 'Low ' + WARNING_SEPARATOR + ' likely to fail';

const ALERT_MESSAGE_HIGHER_MINER_TIP_NEEDED =
  'Setting a higher miner tip is recommended to avoid issues.';
const ALERT_MESSAGE_HIGHER_MAX_BASE_FEE_NEEDED =
  'Setting a higher max base fee is recommended to avoid issues.';
const ALERT_MESSAGE_LOWER =
  'Double check that you entered the correct amount—you’re likely paying more than you need to!';
const ALERT_TITLE_HIGHER_MAX_BASE_FEE_NEEDED =
  'Low max base fee–transaction may get stuck!';
const ALERT_TITLE_HIGHER_MINER_TIP_NEEDED =
  'Low miner tip–transaction may get stuck!';
const ALERT_TITLE_LOWER_MAX_BASE_FEE_NEEDED = 'High max base fee!';
const ALERT_TITLE_LOWER_MINER_TIP_NEEDED = 'High miner tip!';

const FOCUS_TO_MAX_BASE_FEE = 'focusToMaxBaseFee';
const FOCUS_TO_MINER_TIP = 'focusToMinerTip';

export default function FeesPanel({
  currentGasTrend,
  colorForAsset,
  setCanGoBack,
  validateGasParams,
  openCustomOptions,
}: {
  currentGasTrend: keyof typeof GAS_TRENDS;
  colorForAsset: string;
  setCanGoBack: React.Dispatch<React.SetStateAction<boolean>>;
  validateGasParams: React.MutableRefObject<
    (callback?: () => void) => void | undefined
  >;
  openCustomOptions: (focusTo: string) => void;
}) {
  const {
    selectedGasFee,
    currentBlockParams,
    customGasFeeModifiedByUser,
    gasFeeParamsBySpeed,
    updateToCustomGasFee,
  } = useGas();

  const { navigate, dangerouslyGetState } = useNavigation();
  const { colors } = useTheme();

  const {
    // @ts-expect-error ts-migrate(2339)
    params: { type, focusTo, flashbotTransaction = false },
  } = useRoute();

  const isFocused = useIsFocused();
  const prevIsFocused = usePrevious(isFocused);
  const {
    setLastFocusedInputHandle,
    maxBaseFieldRef,
    minerTipFieldRef,
    triggerFocus,
  } = useFeesPanelInputRefs();

  // had to add this for actions happening on the gas speed button
  if (prevIsFocused && !isFocused) {
    Keyboard.dismiss();
  }

  const [customFees, setCustomFees] = useState({
    customMaxBaseFee: gasFeeParamsBySpeed?.[CUSTOM]?.maxFeePerGas?.gwei,
    customMaxPriorityFee:
      gasFeeParamsBySpeed?.[CUSTOM]?.maxPriorityFeePerGas?.gwei,
  });
  const [startPriorityFeeTimeout, stopPriorityFeeTimeout] = useTimeout();
  const [startBaseFeeTimeout, stopBaseFeeTimeout] = useTimeout();

  const [maxPriorityFeeWarning, setMaxPriorityFeeWarning] = useState<
    string | null
  >(null);
  const [maxPriorityFeeError, setMaxPriorityFeeError] = useState<string | null>(
    null
  );

  const [maxBaseFeeWarning, setMaxBaseFeeWarning] = useState<string | null>(
    null
  );
  const [maxBaseFeeError, setMaxBaseFeeError] = useState<string | null>(null);

  const [userProceededOnWarnings, setUserProcededOnWarnings] = useState(false);

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

  const selectedOptionIsCustom = useMemo(
    () => selectedGasFee?.option === CUSTOM,
    [selectedGasFee?.option]
  );

  const { maxFee, currentBaseFee, maxBaseFee, maxPriorityFee } = useMemo(() => {
    const maxFee = selectedGasFee?.gasFee?.maxFee?.native?.value?.display;
    const currentBaseFee = currentBlockParams?.baseFeePerGas?.gwei;
    const maxBaseFee = selectedOptionIsCustom
      ? customMaxBaseFee
      : toFixedDecimals(
          selectedGasFee?.gasFeeParams?.maxFeePerGas?.gwei || 0,
          0
        );

    const maxPriorityFee = selectedOptionIsCustom
      ? customMaxPriorityFee
      : selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas?.gwei;

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
        text = '􀇿';
      } else {
        color = colors.yellowFavorite;
        text = '􀇿';
      }

      const openHelper = () => openGasHelper(type);

      return (
        <ButtonPressAnimation onPress={openHelper}>
          <NewText size="14px" weight="heavy">
            {`${label} `}
            <NewText color={{ custom: color }} weight="bold">
              {text}
            </NewText>
          </NewText>
        </ButtonPressAnimation>
      );
    },
    [colors, openGasHelper, selectedOptionIsCustom]
  );

  const formattedBaseFee = useMemo(
    () => `${toFixedDecimals(currentBaseFee, 0)} Gwei`,
    [currentBaseFee]
  );

  const handleMaxBaseInputGweiPress = useCallback(
    () => setLastFocusedInputHandle(maxBaseFieldRef),
    [maxBaseFieldRef, setLastFocusedInputHandle]
  );

  const handleMinerTipInputGweiPress = useCallback(
    () => setLastFocusedInputHandle(minerTipFieldRef),
    [minerTipFieldRef, setLastFocusedInputHandle]
  );

  const updatePriorityFeePerGas = useCallback(
    priorityFeePerGas => {
      setLastFocusedInputHandle(minerTipFieldRef);
      const maxPriorityFeePerGas =
        selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas;

      const gweiMaxPriorityFeePerGas = Number(maxPriorityFeePerGas?.gwei || 0);

      const newGweiMaxPriorityFeePerGas =
        Math.round((gweiMaxPriorityFeePerGas + priorityFeePerGas) * 100) / 100;

      const newMaxPriorityFeePerGas = parseGasFeeParam(
        gweiToWei(newGweiMaxPriorityFeePerGas)
      );

      if (
        flashbotTransaction &&
        greaterThan(FLASHBOTS_MIN_TIP, newMaxPriorityFeePerGas.gwei)
      )
        return;

      if (greaterThan(0, newMaxPriorityFeePerGas.amount)) return;

      setCustomFees({
        customMaxBaseFee: selectedGasFee?.gasFeeParams?.maxFeePerGas?.gwei,
        customMaxPriorityFee: newMaxPriorityFeePerGas?.gwei,
      });

      const newGasParams = {
        ...selectedGasFee.gasFeeParams,
        maxPriorityFeePerGas: newMaxPriorityFeePerGas,
      };
      updateToCustomGasFee(newGasParams);
    },
    [
      flashbotTransaction,
      minerTipFieldRef,
      selectedGasFee.gasFeeParams,
      setLastFocusedInputHandle,
      updateToCustomGasFee,
    ]
  );

  const updateFeePerGas = useCallback(
    feePerGas => {
      setLastFocusedInputHandle(maxBaseFieldRef);
      const maxFeePerGas =
        selectedGasFee?.gasFeeParams?.maxFeePerGas?.gwei ?? 0;

      const newGweiMaxFeePerGas = toFixedDecimals(
        add(maxFeePerGas, feePerGas),
        0
      );

      const newMaxFeePerGas = parseGasFeeParam(gweiToWei(newGweiMaxFeePerGas));

      if (greaterThan(0, newMaxFeePerGas.amount)) return;

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
    [
      maxBaseFieldRef,
      selectedGasFee.gasFeeParams,
      setLastFocusedInputHandle,
      updateToCustomGasFee,
    ]
  );

  const addMinerTip = useCallback(() => {
    updatePriorityFeePerGas(calculateMinerTipAddDifference(maxPriorityFee));
  }, [maxPriorityFee, updatePriorityFeePerGas]);

  const substMinerTip = useCallback(() => {
    updatePriorityFeePerGas(-calculateMinerTipSubstDifference(maxPriorityFee));
  }, [maxPriorityFee, updatePriorityFeePerGas]);

  const addMaxFee = useCallback(() => {
    updateFeePerGas(GAS_FEE_INCREMENT);
  }, [updateFeePerGas]);

  const substMaxFee = useCallback(() => {
    updateFeePerGas(-GAS_FEE_INCREMENT);
  }, [updateFeePerGas]);

  const onMaxBaseFeeChange = useCallback(
    text => {
      const maxFeePerGas = parseGasFeeParam(gweiToWei(text || 0));

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
    text => {
      const maxPriorityFeePerGas = parseGasFeeParam(gweiToWei(text || 0));

      if (greaterThan(0, maxPriorityFeePerGas.amount)) return;

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

      const errorPrefix = error?.substr(0, error?.indexOf(WARNING_SEPARATOR));
      let errorSuffix = error?.substr(
        error?.indexOf(WARNING_SEPARATOR),
        error?.length
      );

      const warningPrefix = warning?.substr(
        0,
        warning?.indexOf(WARNING_SEPARATOR)
      );
      const warningSuffix = warning?.substr(
        warning?.indexOf(WARNING_SEPARATOR),
        warning?.length
      );

      if (errorSuffix === WARNING_SEPARATOR + ' Enter an amount') {
        errorSuffix = 'Enter an amount';
      }

      return (
        (error && (
          <Box paddingTop="8px">
            <NewText color={{ custom: colors.red }} size="14px" weight="heavy">
              {errorPrefix}
              <NewText
                color={{ custom: colors.alpha(colors.blueGreyDark, 0.5) }}
                size="14px"
                weight="bold"
              >
                {errorSuffix}
              </NewText>
            </NewText>
          </Box>
        )) ||
        (warning && (
          <Box paddingTop="8px">
            <NewText
              color={{ custom: colors.yellowFavorite }}
              size="14px"
              weight="heavy"
            >
              {warningPrefix}
              <NewText
                color={{ custom: colors.alpha(colors.blueGreyDark, 0.5) }}
                size="14px"
                weight="heavy"
              >
                {warningSuffix}
              </NewText>
            </NewText>
          </Box>
        ))
      );
    },
    [colors, selectedOptionIsCustom]
  );

  const onAlertProceeded = useCallback(
    callback => {
      setUserProcededOnWarnings(true);
      setCanGoBack?.(true);
      callback?.();
    },
    [setCanGoBack]
  );

  useEffect(() => {
    const navigationRoutes = dangerouslyGetState().routes;
    const lastRouteName = navigationRoutes?.[navigationRoutes.length - 1]?.name;
    const lastRouteType =
      // @ts-expect-error
      navigationRoutes?.[navigationRoutes.length - 1]?.params?.type;
    if (
      lastRouteName === 'ExplainSheet' &&
      lastRouteType.includes('currentBaseFee')
    ) {
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
    type,
  ]);

  useEffect(() => {
    stopBaseFeeTimeout();
    startBaseFeeTimeout(async () => {
      // there's an e2e modifying this panel so I needed values that aren't dependent on the network conditions
      const maxBaseFeeToValidate = IS_TESTING === 'true' ? 100 : currentBaseFee;

      if (
        !maxBaseFee ||
        isZero(maxBaseFee) ||
        greaterThan(multiply(0.1, maxBaseFeeToValidate), maxBaseFee)
      ) {
        setMaxBaseFeeError(MAX_BASE_FEE_TOO_LOW_ERROR);
      } else {
        setMaxBaseFeeError(null);
      }
      if (
        greaterThan(
          multiply(MAX_BASE_FEE_RANGE[0], maxBaseFeeToValidate),
          maxBaseFee
        )
      ) {
        setMaxBaseFeeWarning(LOWER_THAN_SUGGESTED);
      } else {
        setMaxBaseFeeWarning(null);
      }
    });
  }, [maxBaseFee, currentBaseFee, stopBaseFeeTimeout, startBaseFeeTimeout]);

  useEffect(() => {
    stopPriorityFeeTimeout();
    startPriorityFeeTimeout(() => {
      if (
        !maxPriorityFee ||
        isZero(maxPriorityFee) ||
        greaterThan(1, maxPriorityFee)
      ) {
        setMaxPriorityFeeError(TIP_TOO_LOW_ERROR);
      } else {
        setMaxPriorityFeeError(null);
      }
      // there's an e2e modifying this panel so I needed values that aren't dependant on the network conditions
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
        // there's an e2e modifying this panel so I needed values that aren't dependant on the network conditions
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
    });
  }, [
    gasFeeParamsBySpeed,
    maxPriorityFee,
    startPriorityFeeTimeout,
    stopPriorityFeeTimeout,
  ]);

  const alertMaxBaseFee = useCallback(
    callback => {
      const highAlert = maxBaseFeeWarning === HIGHER_THAN_NECESSARY;
      Alert({
        buttons: [
          {
            onPress: () => onAlertProceeded(callback),
            text: 'Proceed Anyway',
          },
          {
            onPress: () => openCustomOptions(FOCUS_TO_MAX_BASE_FEE),
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
    },
    [maxBaseFeeWarning, onAlertProceeded, openCustomOptions]
  );

  const alertMaxPriority = useCallback(
    callback => {
      const highAlert = maxPriorityFeeWarning === HIGHER_THAN_NECESSARY;
      Alert({
        buttons: [
          {
            onPress: () => onAlertProceeded(callback),
            text: 'Proceed Anyway',
          },
          {
            onPress: () => openCustomOptions(FOCUS_TO_MINER_TIP),
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
    },
    [maxPriorityFeeWarning, onAlertProceeded, openCustomOptions]
  );

  validateGasParams.current = callback => validateParams(callback);

  const validateParams = useCallback(
    callback => {
      if (userProceededOnWarnings || !selectedOptionIsCustom) return;
      const maxBaseValidated = !maxBaseFeeError && !maxBaseFeeWarning;
      const maxPriorityValidated =
        !maxPriorityFeeError && !maxPriorityFeeWarning;
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
    if (
      !userProceededOnWarnings &&
      selectedOptionIsCustom &&
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
  }, [
    focusTo,
    maxBaseFieldRef,
    minerTipFieldRef,
    setLastFocusedInputHandle,
    triggerFocus,
  ]);

  return (
    <Box as={KeyboardAvoidingView}>
      <Inset bottom="12px">
        <Inline alignHorizontal="right">
          <ButtonPressAnimation
            onPress={() => openGasHelper(trendType)}
            scaleTo={1}
          >
            <NewText
              size="14px"
              weight="heavy"
              color={{
                custom: GAS_TRENDS[currentGasTrend]?.color || colors.appleBlue,
              }}
            >
              {GAS_TRENDS[currentGasTrend]?.label}
            </NewText>
          </ButtonPressAnimation>
        </Inline>
      </Inset>
      <Rows space="15px">
        <Row>
          <Box paddingBottom="10px">
            <Inline alignVertical="center" alignHorizontal="justify">
              <Box>
                {renderRowLabel('Current base fee', trendType, null, null)}
              </Box>
              <Box
                as={ButtonPressAnimation}
                // @ts-expect-error
                onPress={() => openGasHelper(trendType)}
                scaleTo={1}
              >
                <NewText size="14px" weight="heavy">
                  {formattedBaseFee}
                </NewText>
              </Box>
            </Inline>
          </Box>
        </Row>

        <Row>
          <Box>
            <Inline alignVertical="center" alignHorizontal="justify">
              <Box>
                {renderRowLabel(
                  'Max base fee',
                  'maxBaseFee',
                  maxBaseFeeError,
                  maxBaseFeeWarning
                )}
                {renderWarning(maxBaseFeeError, maxBaseFeeWarning)}
              </Box>
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
            </Inline>
          </Box>
        </Row>

        <Row>
          <Box>
            <Inline alignVertical="center" alignHorizontal="justify">
              <Box>
                {renderRowLabel(
                  'Miner tip',
                  `minerTip`,
                  maxPriorityFeeError,
                  maxPriorityFeeWarning
                )}
                {renderWarning(maxPriorityFeeError, maxPriorityFeeWarning)}
              </Box>
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
            </Inline>
          </Box>
        </Row>

        <Row>
          <Box paddingTop="10px">
            <Inline alignVertical="center" alignHorizontal="justify">
              <NewText size="14px" weight="heavy">
                Max transaction fee
              </NewText>
              <NewText size="14px" weight="heavy">
                {maxFee}
              </NewText>
            </Inline>
          </Box>
        </Row>
      </Rows>
    </Box>
  );
}
