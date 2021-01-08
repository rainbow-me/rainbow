import { useRoute } from '@react-navigation/native';
import { captureException } from '@sentry/react-native';
import { BigNumber } from 'bignumber.js';
import { get, isEmpty } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, InteractionManager, TurboModuleRegistry } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import Divider from '../components/Divider';
import { GasSpeedButton } from '../components/gas';
import { Centered, Column, Row } from '../components/layout';

import {
  SheetActionButton,
  SheetActionButtonRow,
  SheetHandleFixedToTop,
  SlackSheet,
} from '../components/sheet';
import { Emoji, Text } from '../components/text';
import { getTransaction, toHex } from '../handlers/web3';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';
import TransactionTypes from '../helpers/transactionTypes';
import { sendTransaction } from '../model/wallet';
import { gweiToWei, weiToGwei } from '../parsers/gas';
import { getTitle } from '../parsers/transactions';
import { dataUpdateTransaction } from '../redux/data';
import { explorerInit } from '../redux/explorer';
import { updateGasPriceForSpeed } from '../redux/gas';
import { safeAreaInsetValues } from '../utils';
import deviceUtils from '../utils/deviceUtils';
import {
  useAccountSettings,
  useDimensions,
  useGas,
  useKeyboardHeight,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { ethUnits } from '@rainbow-me/references';
import { colors, position } from '@rainbow-me/styles';
import logger from 'logger';

const isReanimatedAvailable = !(
  !TurboModuleRegistry.get('NativeReanimated') &&
  (!global.__reanimatedModuleProxy || global.__reanimatedModuleProxy.__shimmed)
);

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
  background-color: ${colors.white};
  height: 1000;
  position: absolute;
  bottom: -800;
  width: 100%;
`;

const AnimatedContainer = Animated.createAnimatedComponent(Container);
const AnimatedSheet = Animated.createAnimatedComponent(CenteredSheet);

const GasSpeedButtonContainer = styled(Row)`
  justify-content: center;
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

const calcMinGasPriceAllowed = prevGasPrice => {
  const prevGasPriceBN = new BigNumber(prevGasPrice);

  const newGasPriceBN = prevGasPriceBN
    .times(new BigNumber('110'))
    .dividedBy(new BigNumber('100'));

  const newGasPrice = newGasPriceBN.toFixed();
  return Number(weiToGwei(newGasPrice));
};

export default function SpeedUpAndCancelSheet() {
  const { goBack } = useNavigation();
  const { accountAddress } = useAccountSettings();
  const dispatch = useDispatch();
  const { height: deviceHeight } = useDimensions();
  const keyboardHeight = useKeyboardHeight();
  const {
    gasPrices,
    updateGasPriceOption,
    selectedGasPrice,
    startPollingGasPrices,
    stopPollingGasPrices,
    updateTxFee,
  } = useGas();
  const calculatingGasLimit = useRef(false);
  const {
    params: { type, tx },
  } = useRoute();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [minGasPrice, setMinGasPrice] = useState(
    calcMinGasPriceAllowed(tx.gasPrice)
  );
  const fetchedTx = useRef(false);
  const [gasLimit, setGasLimit] = useState(tx.gasLimit);
  const [data, setData] = useState(tx.data);
  const [value, setValue] = useState(tx.value);
  const [nonce, setNonce] = useState(tx.nonce);

  const getNewGasPrice = useCallback(() => {
    const rawGasPrice = get(selectedGasPrice, 'value.amount');
    const minGasPriceAllowed = gweiToWei(minGasPrice);
    const rawGasPriceBN = new BigNumber(rawGasPrice);
    const minGasPriceAllowedBN = new BigNumber(minGasPriceAllowed);
    return rawGasPriceBN.isGreaterThan(minGasPriceAllowedBN)
      ? toHex(rawGasPrice)
      : toHex(minGasPriceAllowed);
  }, [minGasPrice, selectedGasPrice]);

  const reloadTransactions = useCallback(
    transaction => {
      if (
        (transaction.status === TransactionStatusTypes.speeding_up ||
          transaction.status === TransactionStatusTypes.cancelling) &&
        transaction.type !== TransactionTypes.send
      ) {
        logger.log('Reloading zerion in 5!');
        setTimeout(() => {
          logger.log('Reloading tx from zerion NOW!');
          dispatch(explorerInit());
        }, 5000);
        return;
      }
    },
    [dispatch]
  );

  const handleCancellation = useCallback(async () => {
    try {
      const gasPrice = getNewGasPrice();
      const cancelTxPayload = {
        gasPrice,
        nonce,
        to: accountAddress,
      };
      const originalHash = tx.hash;
      const { hash } = await sendTransaction({
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
        dataUpdateTransaction(originalHash, updatedTx, true, reloadTransactions)
      );
    } catch (e) {
      logger.log('Error submitting cancel tx', e);
    } finally {
      goBack();
    }
  }, [
    accountAddress,
    dispatch,
    getNewGasPrice,
    goBack,
    nonce,
    reloadTransactions,
    tx,
  ]);

  const handleSpeedUp = useCallback(async () => {
    try {
      const gasPrice = getNewGasPrice();
      const fasterTxPayload = {
        data,
        gasLimit,
        gasPrice,
        nonce,
        to: tx.to,
        value,
      };
      const originalHash = tx.hash;
      const { hash } = await sendTransaction({
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
        dataUpdateTransaction(originalHash, updatedTx, true, reloadTransactions)
      );
    } catch (e) {
      logger.log('Error submitting speed up tx', e);
    } finally {
      goBack();
    }
  }, [
    data,
    dispatch,
    gasLimit,
    getNewGasPrice,
    goBack,
    nonce,
    reloadTransactions,
    tx,
    value,
  ]);

  useEffect(() => {
    InteractionManager.runAfterInteractions(async () => {
      if (!fetchedTx.current) {
        const txHash = tx.hash.split('-')[0];
        try {
          fetchedTx.current = true;
          const txObj = await getTransaction(txHash);
          if (txObj) {
            const hexGasLimit = toHex(txObj.gasLimit.toString());
            const hexGasPrice = toHex(txObj.gasPrice.toString());
            const hexValue = toHex(txObj.value.toString());
            const hexData = txObj.data;
            setNonce(txObj.nonce);
            setValue(hexValue);
            setData(hexData);
            setGasLimit(hexGasLimit);
            setMinGasPrice(calcMinGasPriceAllowed(hexGasPrice));
          }
        } catch (e) {
          logger.log('something went wrong while fetching tx info ', e);
          captureException(e);
          if (type === SPEED_UP) {
            Alert.alert(
              'Unable to speed up transaction',
              'There was a problem while fetching the transaction data. Please try again...'
            );
            goBack();
          }
          // We don't care about this for cancellations
        }
        startPollingGasPrices();
        // Always default to fast
        updateGasPriceOption('fast');
      }
    });
    return () => {
      stopPollingGasPrices();
    };
  }, [
    goBack,
    startPollingGasPrices,
    stopPollingGasPrices,
    tx,
    tx.gasLimit,
    tx.gasPrice,
    tx.hash,
    type,
    updateGasPriceOption,
  ]);

  useEffect(() => {
    if (!isEmpty(gasPrices) && !calculatingGasLimit.current) {
      calculatingGasLimit.current = true;
      if (Number(gweiToWei(minGasPrice)) > Number(gasPrices.fast.value)) {
        dispatch(updateGasPriceForSpeed('fast', gweiToWei(minGasPrice)));
      }
      const gasLimitForNewTx =
        type === CANCEL_TX ? ethUnits.basic_tx : tx.gasLimit;
      updateTxFee(gasLimitForNewTx);
      calculatingGasLimit.current = false;
    }
  }, [dispatch, gasPrices, minGasPrice, tx, tx.gasLimit, type, updateTxFee]);

  const handleCustomGasFocus = useCallback(() => {
    setKeyboardVisible(true);
  }, []);
  const handleCustomGasBlur = useCallback(() => {
    setKeyboardVisible(false);
  }, []);

  const offset = useSharedValue(0);
  const animatedContainerStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: offset.value }],
    };
  });

  const fallbackStyles = {
    marginBottom: keyboardVisible ? keyboardHeight : 0,
  };

  useEffect(() => {
    if (keyboardVisible) {
      offset.value = withSpring(
        -keyboardHeight + safeAreaInsetValues.bottom - (android ? 50 : 10),
        springConfig
      );
    } else {
      offset.value = withSpring(0, springConfig);
    }
  }, [keyboardHeight, keyboardVisible, offset]);
  const sheetHeight = ios
    ? (type === CANCEL_TX ? 491 : 442) + safeAreaInsetValues.bottom
    : (type === CANCEL_TX ? 770 : 770) + safeAreaInsetValues.bottom;

  const marginTop = android
    ? deviceHeight - sheetHeight + (type === CANCEL_TX ? 290 : 340)
    : null;

  return (
    <AnimatedContainer
      style={isReanimatedAvailable ? animatedContainerStyles : fallbackStyles}
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
              <Column marginBottom={12} marginTop={30}>
                <Emoji
                  name={type === CANCEL_TX ? 'skull_and_crossbones' : 'rocket'}
                  size="biggest"
                />
              </Column>
              <Column marginBottom={12}>
                <Text
                  align="center"
                  color={colors.dark}
                  size="big"
                  weight="bold"
                >
                  {title[type]}
                </Text>
              </Column>
              <Column marginBottom={30} maxWidth={375} paddingHorizontal={42}>
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
                  <SheetActionButtonRow ignorePaddingBottom ignorePaddingTop>
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
                      label="Cancel"
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
                  minGasPrice={minGasPrice}
                  onCustomGasBlur={handleCustomGasBlur}
                  onCustomGasFocus={handleCustomGasFocus}
                  options={['fast', 'custom']}
                  theme="light"
                  type="transaction"
                />
              </GasSpeedButtonContainer>
            </Centered>
          </AnimatedSheet>
        </Column>
      </SlackSheet>
    </AnimatedContainer>
  );
}
