import { useRoute } from '@react-navigation/native';
import { captureException } from '@sentry/react-native';
import { BigNumber } from 'bignumber.js';
import lang from 'i18n-js';
import { isEmpty } from 'lodash';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import { useDispatch } from 'react-redux';
import Divider from '../components/Divider';
import Spinner from '../components/Spinner';
import { GasSpeedButton } from '../components/gas';
import { Centered, Column, Row } from '../components/layout';
import {
  SheetActionButton,
  SheetActionButtonRow,
  SheetHandleFixedToTop,
  SheetKeyboardAnimation,
  SlackSheet,
} from '../components/sheet';
import { Emoji, Text } from '../components/text';
import { GasFeeTypes, TransactionStatusTypes } from '@rainbow-me/entities';
import {
  getProviderForNetwork,
  isL2Network,
  toHex,
} from '@rainbow-me/handlers/web3';
import { greaterThan } from '@rainbow-me/helpers/utilities';
import { useAccountSettings, useDimensions, useGas } from '@rainbow-me/hooks';
import { sendTransaction } from '@rainbow-me/model/wallet';
import { useNavigation } from '@rainbow-me/navigation';
import { getTitle } from '@rainbow-me/parsers';
import { dataUpdateTransaction } from '@rainbow-me/redux/data';
import { updateGasFeeForSpeed } from '@rainbow-me/redux/gas';
import { ethUnits } from '@rainbow-me/references';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';
import { gasUtils, safeAreaInsetValues } from '@rainbow-me/utils';
import logger from 'logger';

const { CUSTOM, URGENT } = gasUtils;

const springConfig = {
  damping: 500,
  mass: 3,
  stiffness: 1000,
};

const Container = styled(Centered).attrs({
  direction: 'column',
})(({ deviceHeight, height }) => ({
  ...(height && {
    height: height + deviceHeight,
  }),
  ...position.coverAsObject,
}));

const CenteredSheet = styled(Centered)({
  borderTopLeftRadius: 39,
  borderTopRightRadius: 39,
});

const ExtendedSheetBackground = styled.View({
  backgroundColor: ({ theme: { colors } }) => colors.white,
  bottom: -800,
  height: 1000,
  position: 'absolute',
  width: '100%',
});

const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs(
  ({ theme: { colors } }) => ({
    color: colors.alpha(colors.blueGreyDark, 0.3),
    size: 'large',
  })
)({});

const AnimatedContainer = Animated.createAnimatedComponent(Container);
const AnimatedSheet = Animated.createAnimatedComponent(CenteredSheet);

const GasSpeedButtonContainer = styled(Row).attrs({
  justify: 'center',
})({});

const CANCEL_TX = 'cancel';
const SPEED_UP = 'speed_up';

const title = {
  [CANCEL_TX]: 'Cancel transaction',
  [SPEED_UP]: 'Speed up transaction',
};

const text = {
  [CANCEL_TX]: `This will attempt to cancel your pending transaction. It requires broadcasting another transaction!`,
  [SPEED_UP]: `This will speed up your pending transaction by replacing it. There’s still a chance your original transaction will confirm first!`,
};

const calcGasParamRetryValue = prevWeiValue => {
  const prevWeiValueBN = new BigNumber(prevWeiValue);

  const newWeiValueBN = prevWeiValueBN
    .times(new BigNumber('110'))
    .dividedBy(new BigNumber('100'));

  const newWeiValue = newWeiValueBN.toFixed(0);
  return Number(newWeiValue);
};

export default function SpeedUpAndCancelSheet() {
  const { goBack } = useNavigation();
  const { accountAddress, network } = useAccountSettings();
  const dispatch = useDispatch();
  const { height: deviceHeight } = useDimensions();
  const {
    gasFeeParamsBySpeed,
    updateGasFeeOption,
    selectedGasFee,
    startPollingGasFees,
    stopPollingGasFees,
    updateTxFee,
  } = useGas();
  const calculatingGasLimit = useRef(false);
  const speedUrgentSelected = useRef(false);
  const {
    params: { type, tx, accentColor, onSendTransactionCallback },
  } = useRoute();

  const [ready, setReady] = useState(false);
  const [txType, setTxType] = useState();
  const [minGasPrice, setMinGasPrice] = useState(
    calcGasParamRetryValue(tx.gasPrice)
  );
  const [minMaxPriorityFeePerGas, setMinMaxPriorityFeePerGas] = useState(
    calcGasParamRetryValue(tx.maxPriorityFeePerGas)
  );
  const [minMaxFeePerGas, setMinMaxFeePerGas] = useState(
    calcGasParamRetryValue(tx.maxFeePerGas)
  );
  const fetchedTx = useRef(false);
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [currentProvider, setCurrentProvider] = useState(null);
  const [data, setData] = useState(null);
  const [gasLimit, setGasLimit] = useState(null);
  const [nonce, setNonce] = useState(null);
  const [to, setTo] = useState(tx.to);
  const [value, setValue] = useState(null);

  const getNewTransactionGasParams = useCallback(() => {
    if (txType === GasFeeTypes.eip1559) {
      const rawMaxPriorityFeePerGas =
        selectedGasFee?.gasFeeParams?.maxPriorityFeePerGas?.amount;
      const rawMaxFeePerGas =
        selectedGasFee?.gasFeeParams?.maxFeePerGas?.amount;

      const maxPriorityFeePerGas = greaterThan(
        rawMaxPriorityFeePerGas,
        minMaxPriorityFeePerGas
      )
        ? toHex(rawMaxPriorityFeePerGas)
        : toHex(minMaxPriorityFeePerGas);

      const maxFeePerGas = greaterThan(rawMaxFeePerGas, minMaxFeePerGas)
        ? toHex(rawMaxFeePerGas)
        : toHex(minMaxFeePerGas);
      return { maxFeePerGas, maxPriorityFeePerGas };
    } else {
      const rawGasPrice = selectedGasFee?.gasFeeParams?.gasPrice?.amount;
      return {
        gasPrice: greaterThan(rawGasPrice, minGasPrice)
          ? toHex(rawGasPrice)
          : toHex(minGasPrice),
      };
    }
  }, [
    txType,
    selectedGasFee,
    minMaxPriorityFeePerGas,
    minMaxFeePerGas,
    minGasPrice,
  ]);

  const handleCancellation = useCallback(async () => {
    try {
      const newGasParams = getNewTransactionGasParams();
      const cancelTxPayload = {
        nonce,
        to: accountAddress,
        ...newGasParams,
      };
      const originalHash = tx.hash;
      const {
        result: { hash },
      } = await sendTransaction({
        provider: currentProvider,
        transaction: cancelTxPayload,
      });

      const updatedTx = { ...tx };
      // Update the hash on the copy of the original tx
      updatedTx.hash = hash;
      if (originalHash.split('-').length > 1) {
        updatedTx.hash += `-${originalHash.split('-')[1]}`;
      }
      updatedTx.status = TransactionStatusTypes.cancelling;
      updatedTx.title = getTitle(updatedTx);
      dispatch(
        dataUpdateTransaction(originalHash, updatedTx, true, currentProvider)
      );
    } catch (e) {
      logger.log('Error submitting cancel tx', e);
    } finally {
      goBack();
    }
  }, [
    accountAddress,
    currentProvider,
    dispatch,
    getNewTransactionGasParams,
    goBack,
    nonce,
    tx,
  ]);

  const handleSpeedUp = useCallback(async () => {
    try {
      const newGasParams = getNewTransactionGasParams();
      const fasterTxPayload = {
        data,
        gasLimit,
        nonce,
        to,
        value,
        ...newGasParams,
      };
      const originalHash = tx.hash;
      const {
        result: { hash },
      } = await sendTransaction({
        provider: currentProvider,
        transaction: fasterTxPayload,
      });
      onSendTransactionCallback?.(hash);
      const updatedTx = { ...tx };
      // Update the hash on the copy of the original tx
      updatedTx.hash = hash;
      if (originalHash.split('-').length > 1) {
        updatedTx.hash += `-${originalHash.split('-')[1]}`;
      }
      updatedTx.status = TransactionStatusTypes.speeding_up;
      updatedTx.title = getTitle(updatedTx);
      dispatch(
        dataUpdateTransaction(originalHash, updatedTx, true, currentProvider)
      );
    } catch (e) {
      logger.log('Error submitting speed up tx', e);
    } finally {
      goBack();
    }
  }, [
    currentProvider,
    data,
    dispatch,
    gasLimit,
    getNewTransactionGasParams,
    goBack,
    nonce,
    onSendTransactionCallback,
    to,
    tx,
    value,
  ]);

  // Set the network
  useEffect(() => {
    setCurrentNetwork(tx.network || network);
  }, [network, tx.network]);

  // Set the provider
  useEffect(() => {
    if (currentNetwork) {
      startPollingGasFees(currentNetwork);
      const updateProvider = async () => {
        const provider = await getProviderForNetwork(currentNetwork);
        setCurrentProvider(provider);
      };

      updateProvider();

      return () => {
        stopPollingGasFees();
      };
    }
  }, [currentNetwork, startPollingGasFees, stopPollingGasFees]);

  // Update gas limit
  useEffect(() => {
    if (
      !speedUrgentSelected.current &&
      !isEmpty(gasFeeParamsBySpeed) &&
      gasLimit
    ) {
      updateTxFee(gasLimit);
      // Always default to urgent
      updateGasFeeOption(gasUtils.URGENT);
      speedUrgentSelected.current = true;
    }
  }, [
    currentNetwork,
    gasLimit,
    gasFeeParamsBySpeed,
    updateGasFeeOption,
    updateTxFee,
  ]);

  useEffect(() => {
    const init = async () => {
      if (currentNetwork && currentProvider && !fetchedTx.current) {
        try {
          fetchedTx.current = true;
          const hexGasLimit = toHex(tx.gasLimit.toString());
          const hexValue = toHex(tx.value.toString());
          const hexData = tx.data;

          setReady(true);
          setNonce(tx.nonce);
          setValue(hexValue);
          setData(hexData);
          setTo(tx.txTo);
          setGasLimit(hexGasLimit);
          if (!isL2Network(tx.network)) {
            setTxType(GasFeeTypes.eip1559);
            const hexMaxPriorityFeePerGas = toHex(
              tx.maxPriorityFeePerGas.toString()
            );
            setMinMaxPriorityFeePerGas(
              calcGasParamRetryValue(hexMaxPriorityFeePerGas)
            );
            const hexMaxFeePerGas = toHex(tx.maxFeePerGas.toString());
            setMinMaxFeePerGas(calcGasParamRetryValue(hexMaxFeePerGas));
          } else {
            setTxType(GasFeeTypes.legacy);
            const hexGasPrice = toHex(tx.gasPrice.toString());
            setMinGasPrice(calcGasParamRetryValue(hexGasPrice));
          }
        } catch (e) {
          logger.log('something went wrong while fetching tx info ', e);
          logger.sentry(
            'Error speeding up or canceling transaction: [error]',
            e
          );
          logger.sentry(
            'Error speeding up or canceling transaction: [transaction]',
            tx
          );
          const speedUpOrCancelError = new Error(
            'Error speeding up or canceling transaction'
          );
          captureException(speedUpOrCancelError);
          if (type === SPEED_UP) {
            Alert.alert(
              lang.t('wallet.speed_up.unable_to_speed_up'),
              lang.t('wallet.speed_up.problem_while_fetching_transaction_data'),
              [
                {
                  onPress: () => goBack(),
                },
              ]
            );
          }
          // We don't care about this for cancellations
        }
      }
    };

    init();
  }, [
    currentNetwork,
    currentProvider,
    goBack,
    network,
    tx,
    tx.gasLimit,
    tx.hash,
    type,
    updateGasFeeOption,
  ]);

  useEffect(() => {
    if (!isEmpty(gasFeeParamsBySpeed) && !calculatingGasLimit.current) {
      calculatingGasLimit.current = true;
      if (
        greaterThan(
          minMaxPriorityFeePerGas,
          gasFeeParamsBySpeed?.fast?.maxPriorityFeePerGas?.amount
        )
      ) {
        dispatch(updateGasFeeForSpeed(gasUtils.FAST, minMaxPriorityFeePerGas));
      }
      const gasLimitForNewTx =
        type === CANCEL_TX ? ethUnits.basic_tx : tx.gasLimit;
      updateTxFee(gasLimitForNewTx);
      calculatingGasLimit.current = false;
    }
  }, [
    dispatch,
    gasFeeParamsBySpeed,
    minMaxPriorityFeePerGas,
    tx,
    tx.gasLimit,
    type,
    updateTxFee,
  ]);

  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withSpring(0, springConfig);
  }, [offset]);

  const sheetHeight = ios
    ? (type === CANCEL_TX ? 491 : 442) + safeAreaInsetValues.bottom
    : 850 + safeAreaInsetValues.bottom;

  const marginTop = android
    ? deviceHeight - sheetHeight + (type === CANCEL_TX ? 290 : 340)
    : null;

  const { colors, isDarkMode } = useTheme();

  return (
    <SheetKeyboardAnimation
      as={AnimatedContainer}
      isKeyboardVisible={false}
      translateY={offset}
    >
      <ExtendedSheetBackground />
      <SlackSheet
        backgroundColor={colors.transparent}
        borderRadius={0}
        height={sheetHeight}
        hideHandle
        scrollEnabled={false}
      >
        <Column>
          <AnimatedSheet
            backgroundColor={colors.white}
            borderRadius={39}
            direction="column"
            marginTop={marginTop}
            paddingBottom={android ? 30 : 0}
          >
            <SheetHandleFixedToTop showBlur={false} />
            <Centered direction="column">
              {!ready ? (
                <Column
                  align="center"
                  backgroundColor={colors.white}
                  height={300}
                  justify="center"
                  marginBottom={12}
                  marginTop={30}
                >
                  <LoadingSpinner />
                </Column>
              ) : (
                <Fragment>
                  <Column marginBottom={12} marginTop={30}>
                    <Emoji
                      name={
                        type === CANCEL_TX ? 'skull_and_crossbones' : 'rocket'
                      }
                      size="biggest"
                    />
                  </Column>
                  <Column marginBottom={12}>
                    <Text
                      align="center"
                      color={colors.dark}
                      size="big"
                      weight="heavy"
                    >
                      {title[type]}
                    </Text>
                  </Column>
                  <Column
                    marginBottom={30}
                    maxWidth={375}
                    paddingHorizontal={42}
                  >
                    <Text
                      align="center"
                      color={colors.alpha(colors.blueGreyDark, 0.5)}
                      lineHeight="looser"
                      size="large"
                      weight="regular"
                    >
                      {text[type]}
                    </Text>
                  </Column>
                  <Centered marginBottom={24}>
                    <Divider
                      color={colors.rowDividerExtraLight}
                      inset={[0, 143.5]}
                    />
                  </Centered>
                  {type === CANCEL_TX && (
                    <Column marginBottom={android && 15}>
                      <SheetActionButtonRow
                        ignorePaddingBottom
                        ignorePaddingTop={ios}
                      >
                        <SheetActionButton
                          color={colors.red}
                          label={`􀎽 ${lang.t('button.attempt_cancellation')}`}
                          onPress={handleCancellation}
                          size="big"
                          weight="bold"
                        />
                      </SheetActionButtonRow>
                      <SheetActionButtonRow ignorePaddingBottom>
                        <SheetActionButton
                          color={colors.white}
                          label={lang.t('button.close')}
                          onPress={goBack}
                          size="big"
                          textColor={colors.alpha(colors.blueGreyDark, 0.8)}
                          weight="bold"
                        />
                      </SheetActionButtonRow>
                    </Column>
                  )}
                  {type === SPEED_UP && (
                    <SheetActionButtonRow
                      ignorePaddingBottom={ios}
                      ignorePaddingTop={ios}
                    >
                      <SheetActionButton
                        color={colors.white}
                        label={lang.t('button.cancel')}
                        onPress={goBack}
                        size="big"
                        textColor={colors.alpha(colors.blueGreyDark, 0.8)}
                        weight="bold"
                      />
                      <SheetActionButton
                        color={accentColor || colors.appleBlue}
                        label={`􀎽 ${lang.t('button.confirm')}`}
                        onPress={handleSpeedUp}
                        size="big"
                        weight="bold"
                      />
                    </SheetActionButtonRow>
                  )}
                  <GasSpeedButtonContainer>
                    <GasSpeedButton
                      asset={{ color: accentColor }}
                      currentNetwork={currentNetwork}
                      speeds={[URGENT, CUSTOM]}
                      theme={isDarkMode ? 'dark' : 'light'}
                    />
                  </GasSpeedButtonContainer>
                </Fragment>
              )}
            </Centered>
          </AnimatedSheet>
        </Column>
      </SlackSheet>
    </SheetKeyboardAnimation>
  );
}
