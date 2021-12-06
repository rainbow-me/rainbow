import { useRoute } from '@react-navigation/native';
import { captureException } from '@sentry/react-native';
import { BigNumber } from 'bignumber.js';
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
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Divider' was resolved to '/U... Remove this comment to see the full error message
import Divider from '../components/Divider';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Spinner' was resolved to '/U... Remove this comment to see the full error message
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
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { GasFeeTypes, TransactionStatusTypes } from '@rainbow-me/entities';
import {
  getProviderForNetwork,
  isEIP1559LegacyNetwork,
  toHex,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
} from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/utilities'... Remove this comment to see the full error message
import { greaterThan } from '@rainbow-me/helpers/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings, useDimensions, useGas } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/model/wallet' or i... Remove this comment to see the full error message
import { sendTransaction } from '@rainbow-me/model/wallet';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/parsers' or its co... Remove this comment to see the full error message
import { getTitle } from '@rainbow-me/parsers';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/data' or its... Remove this comment to see the full error message
import { dataUpdateTransaction } from '@rainbow-me/redux/data';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/gas' or its ... Remove this comment to see the full error message
import { updateGasFeeForSpeed } from '@rainbow-me/redux/gas';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { ethUnits } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { gasUtils, safeAreaInsetValues } from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

const { CUSTOM, URGENT } = gasUtils;

const springConfig = {
  damping: 500,
  mass: 3,
  stiffness: 1000,
};

const Container = styled(Centered).attrs({
  direction: 'column',
})`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

const CenteredSheet = styled(Centered)`
  border-top-left-radius: 39;
  border-top-right-radius: 39;
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const ExtendedSheetBackground = styled.View`
  background-color: ${({ theme: { colors } }: any) => colors.white};
  height: 1000;
  position: absolute;
  bottom: -800;
  width: 100%;
`;

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs(
  ({ theme: { colors } }) => ({
    color: colors.alpha(colors.blueGreyDark, 0.3),
    size: 'large',
  })
)``;

const AnimatedContainer = Animated.createAnimatedComponent(Container);
const AnimatedSheet = Animated.createAnimatedComponent(CenteredSheet);

const GasSpeedButtonContainer = styled(Row).attrs({
  justify: 'center',
})``;

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

const calcGasParamRetryValue = (prevWeiValue: any) => {
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
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type 'Readonly<o... Remove this comment to see the full error message
    params: { type, tx },
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
          if (!isEIP1559LegacyNetwork(tx.network)) {
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
              'Unable to speed up transaction',
              'There was a problem while fetching the transaction data. Please try again...',
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

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  const sheetHeight = ios
    ? (type === CANCEL_TX ? 491 : 442) + safeAreaInsetValues.bottom
    : 850 + safeAreaInsetValues.bottom;

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  const marginTop = android
    ? deviceHeight - sheetHeight + (type === CANCEL_TX ? 290 : 340)
    : null;

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors, isDarkMode } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <SheetKeyboardAnimation
      as={AnimatedContainer}
      isKeyboardVisible={false}
      translateY={offset}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ExtendedSheetBackground />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SlackSheet
        backgroundColor={colors.transparent}
        borderRadius={0}
        height={sheetHeight}
        hideHandle
        scrollEnabled={false}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Column>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <AnimatedSheet
            backgroundColor={colors.white}
            borderRadius={39}
            direction="column"
            marginTop={marginTop}
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
            paddingBottom={android ? 30 : 0}
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <SheetHandleFixedToTop showBlur={false} />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Centered direction="column">
              {!ready ? (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Column
                  align="center"
                  backgroundColor={colors.white}
                  height={300}
                  justify="center"
                  marginBottom={12}
                  marginTop={30}
                >
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <LoadingSpinner />
                </Column>
              ) : (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Fragment>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Column marginBottom={12} marginTop={30}>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <Emoji
                      name={
                        type === CANCEL_TX ? 'skull_and_crossbones' : 'rocket'
                      }
                      size="biggest"
                    />
                  </Column>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Column marginBottom={12}>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <Text
                      align="center"
                      color={colors.dark}
                      size="big"
                      weight="heavy"
                    >
                      // @ts-expect-error ts-migrate(7053) FIXME: Element
                      implicitly has an 'any' type because expre... Remove this
                      comment to see the full error message
                      {title[type]}
                    </Text>
                  </Column>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Column
                    marginBottom={30}
                    maxWidth={375}
                    paddingHorizontal={42}
                  >
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <Text
                      align="center"
                      color={colors.alpha(colors.blueGreyDark, 0.5)}
                      lineHeight="looser"
                      size="large"
                      weight="regular"
                    >
                      // @ts-expect-error ts-migrate(7053) FIXME: Element
                      implicitly has an 'any' type because expre... Remove this
                      comment to see the full error message
                      {text[type]}
                    </Text>
                  </Column>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Centered marginBottom={24}>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <Divider
                      color={colors.rowDividerExtraLight}
                      inset={[0, 143.5]}
                    />
                  </Centered>
                  {type === CANCEL_TX && (
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Column marginBottom={android && 15}>
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                      JSX unless the '--jsx' flag is provided... Remove this
                      comment to see the full error message
                      <SheetActionButtonRow
                        ignorePaddingBottom
                        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
                        ignorePaddingTop={ios}
                      >
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                        JSX unless the '--jsx' flag is provided... Remove this
                        comment to see the full error message
                        <SheetActionButton
                          color={colors.red}
                          label="􀎽 Attempt Cancellation"
                          onPress={handleCancellation}
                          size="big"
                          weight="bold"
                        />
                      </SheetActionButtonRow>
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                      JSX unless the '--jsx' flag is provided... Remove this
                      comment to see the full error message
                      <SheetActionButtonRow ignorePaddingBottom>
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                        JSX unless the '--jsx' flag is provided... Remove this
                        comment to see the full error message
                        <SheetActionButton
                          color={colors.white}
                          label="Close"
                          onPress={goBack}
                          size="big"
                          textColor={colors.alpha(colors.blueGreyDark, 0.8)}
                          weight="bold"
                        />
                      </SheetActionButtonRow>
                    </Column>
                  )}
                  {type === SPEED_UP && (
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <SheetActionButtonRow
                      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
                      ignorePaddingBottom={ios}
                      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
                      ignorePaddingTop={ios}
                    >
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                      JSX unless the '--jsx' flag is provided... Remove this
                      comment to see the full error message
                      <SheetActionButton
                        color={colors.white}
                        label="Cancel"
                        onPress={goBack}
                        size="big"
                        textColor={colors.alpha(colors.blueGreyDark, 0.8)}
                        weight="bold"
                      />
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                      JSX unless the '--jsx' flag is provided... Remove this
                      comment to see the full error message
                      <SheetActionButton
                        color={colors.appleBlue}
                        label="􀎽 Confirm"
                        onPress={handleSpeedUp}
                        size="big"
                        weight="bold"
                      />
                    </SheetActionButtonRow>
                  )}
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <GasSpeedButtonContainer>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <GasSpeedButton
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
