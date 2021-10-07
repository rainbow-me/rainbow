import { useRoute } from '@react-navigation/native';
import { captureException } from '@sentry/react-native';
import { BigNumber } from 'bignumber.js';
import { get, isEmpty } from 'lodash';
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
import { TransactionStatusTypes } from '@rainbow-me/entities';
import { getProviderForNetwork, toHex } from '@rainbow-me/handlers/web3';
import {
  useAccountSettings,
  useBooleanState,
  useDimensions,
  useGas,
  useKeyboardHeight,
} from '@rainbow-me/hooks';
import { sendTransaction } from '@rainbow-me/model/wallet';
import { useNavigation } from '@rainbow-me/navigation';
import { getTitle } from '@rainbow-me/parsers';
import { dataUpdateTransaction } from '@rainbow-me/redux/data';
import { updateGasFeeForSpeed } from '@rainbow-me/redux/gas';
import { ethUnits } from '@rainbow-me/references';
import { position } from '@rainbow-me/styles';
import { deviceUtils, safeAreaInsetValues } from '@rainbow-me/utils';
import logger from 'logger';

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

const ExtendedSheetBackground = styled.View`
  background-color: ${({ theme: { colors } }) => colors.white};
  height: 1000;
  position: absolute;
  bottom: -800;
  width: 100%;
`;

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
})`
  margin-bottom: 19px;
  margin-top: 4px;
  width: ${deviceUtils.dimensions.width - 10};
`;

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
  const keyboardHeight = useKeyboardHeight();
  const {
    gasFeeParamsBySpeed,
    updateGasFeeOption,
    selectedGasFee,
    startPollingGasFees,
    stopPollingGasFees,
    updateTxFee,
  } = useGas();
  const calculatingGasLimit = useRef(false);
  const {
    params: { type, tx },
  } = useRoute();
  const [ready, setReady] = useState(false);
  const [isKeyboardVisible, showKeyboard, hideKeyboard] = useBooleanState();
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

  const getNewGasParams = useCallback(() => {
    const rawMaxPriorityFeePerGas = get(
      selectedGasFee,
      'gasFeeParams.maxPriorityFeePerGas.amount'
    );
    const rawMaxFeePerGas = get(
      selectedGasFee,
      'gasFeeParams.maxFeePerGas.amount'
    );
    const rawMaxPriorityFeePerGasBN = new BigNumber(rawMaxPriorityFeePerGas);
    const minMaxPriorityFeePerGasAllowedBN = new BigNumber(
      minMaxPriorityFeePerGas
    );
    const rawMaxFeePerGasBN = new BigNumber(rawMaxFeePerGas);
    const minMaxFeePerGasAllowedBN = new BigNumber(minMaxFeePerGas);

    const maxPriorityFeePerGas = rawMaxPriorityFeePerGasBN.isGreaterThan(
      minMaxPriorityFeePerGasAllowedBN
    )
      ? toHex(rawMaxPriorityFeePerGas)
      : toHex(minMaxPriorityFeePerGas);

    const maxFeePerGas = rawMaxFeePerGasBN.isGreaterThan(
      minMaxFeePerGasAllowedBN
    )
      ? toHex(rawMaxFeePerGas)
      : toHex(minMaxFeePerGas);
    return { maxFeePerGas, maxPriorityFeePerGas };
  }, [minMaxPriorityFeePerGas, minMaxFeePerGas, selectedGasFee]);

  const handleCancellation = useCallback(async () => {
    try {
      const { maxFeePerGas, maxPriorityFeePerGas } = getNewGasParams();
      const cancelTxPayload = {
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        to: accountAddress,
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
    getNewGasParams,
    goBack,
    nonce,
    tx,
  ]);

  const handleSpeedUp = useCallback(async () => {
    try {
      const { maxFeePerGas, maxPriorityFeePerGas } = getNewGasParams();
      const fasterTxPayload = {
        data,
        gasLimit,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        to,
        value,
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
    getNewGasParams,
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
    if (!isEmpty(gasFeeParamsBySpeed) && gasLimit) {
      updateTxFee(gasLimit, null, currentNetwork);
      // Always default to fast
      updateGasFeeOption('fast');
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
        const txHash = tx.hash.split('-')[0];
        try {
          fetchedTx.current = true;
          const txObj = await currentProvider.getTransaction(txHash);
          if (txObj) {
            const hexGasLimit = toHex(txObj.gasLimit.toString());
            const hexMaxFeePerGas = toHex(txObj.maxFeePerGas.toString());
            const hexMaxPriorityFeePerGas = toHex(
              txObj.maxPriorityFeePerGas.toString()
            );
            const hexValue = toHex(txObj.value.toString());
            const hexData = txObj.data;
            setReady(true);
            setNonce(txObj.nonce);
            setValue(hexValue);
            setData(hexData);
            setTo(txObj.to);
            setGasLimit(hexGasLimit);
            setMinMaxPriorityFeePerGas(
              calcGasParamRetryValue(hexMaxPriorityFeePerGas)
            );
            setMinMaxFeePerGas(calcGasParamRetryValue(hexMaxFeePerGas));
          }
        } catch (e) {
          logger.log('something went wrong while fetching tx info ', e);
          captureException(e);
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
      // we only speed up / cancel for eip1559 supported networks
      if (
        Number(minMaxPriorityFeePerGas) >
        Number(gasFeeParamsBySpeed.fast.maxPriorityFeePerGas.amount)
      ) {
        dispatch(updateGasFeeForSpeed('fast', minMaxPriorityFeePerGas));
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
    if (isKeyboardVisible) {
      offset.value = withSpring(
        -keyboardHeight + safeAreaInsetValues.bottom - (android ? 50 : 10),
        springConfig
      );
    } else {
      offset.value = withSpring(0, springConfig);
    }
  }, [isKeyboardVisible, keyboardHeight, offset]);
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
      isKeyboardVisible={isKeyboardVisible}
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
                    <Column>
                      <SheetActionButtonRow
                        ignorePaddingBottom
                        ignorePaddingTop
                      >
                        <SheetActionButton
                          color={colors.red}
                          fullWidth
                          label="􀎽 Attempt Cancellation"
                          onPress={handleCancellation}
                          size="big"
                          weight="bold"
                        />
                      </SheetActionButtonRow>
                      <SheetActionButtonRow ignorePaddingBottom>
                        <SheetActionButton
                          color={colors.white}
                          fullWidth
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
                    <SheetActionButtonRow ignorePaddingBottom ignorePaddingTop>
                      <SheetActionButton
                        color={colors.white}
                        label="Cancel"
                        onPress={goBack}
                        size="big"
                        textColor={colors.alpha(colors.blueGreyDark, 0.8)}
                        weight="bold"
                      />
                      <SheetActionButton
                        color={colors.appleBlue}
                        label="􀎽 Confirm"
                        onPress={handleSpeedUp}
                        size="big"
                        weight="bold"
                      />
                    </SheetActionButtonRow>
                  )}
                  <GasSpeedButtonContainer>
                    <GasSpeedButton
                      currentNetwork={currentNetwork}
                      minMaxPriorityFeePerGas={minMaxPriorityFeePerGas}
                      onCustomGasBlur={hideKeyboard}
                      onCustomGasFocus={showKeyboard}
                      options={['fast', 'custom']}
                      theme={isDarkMode ? 'dark' : 'light'}
                      type="transaction"
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
