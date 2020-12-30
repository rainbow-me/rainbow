import { useRoute } from '@react-navigation/native';
import { get, isEmpty } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager, TurboModuleRegistry } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import { GasSpeedButton } from '../components/gas';
import { Centered, Column, Row } from '../components/layout';

import {
  SheetActionButton,
  SheetActionButtonRow,
  SheetHandleFixedToTop,
  SlackSheet,
} from '../components/sheet';
import { Emoji, Text } from '../components/text';
import { toHex } from '../handlers/web3';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';
import { sendTransaction } from '../model/wallet';
import { getTitle } from '../parsers/transactions';
import { dataUpdateTransaction } from '../redux/data';
import { safeAreaInsetValues } from '../utils';
import {
  useAccountSettings,
  useDimensions,
  useGas,
  useKeyboardHeight,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
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

// const Container = styled(Column)`
//   flex: 1;
// `;
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

const AnimatedContainer = Animated.createAnimatedComponent(Container);
const AnimatedSheet = Animated.createAnimatedComponent(CenteredSheet);

const GasSpeedButtonContainer = styled(Row)`
  padding-left: 10;
  padding-right: 10;
  justify-content: flex-start;
  margin-bottom: 19px;
`;

const CANCEL_TX = 'cancel';
const SPEED_UP = 'speed_up';

const title = {
  [CANCEL_TX]: 'Cancel transaction',
  [SPEED_UP]: 'Speed Up transaction',
};

const text = {
  [CANCEL_TX]: `This will attempt to cancel your pending transaction. It requires broadcasting another transaction!`,
  [SPEED_UP]: `This will speed up your pending transaction by replacing it. There’s still a chance your original transaction will confirm first!`,
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

  const handleCancellation = useCallback(async () => {
    const rawGasPrice = get(selectedGasPrice, 'value.amount');

    // TODO - Check that rawGasPrice is >= 1.1x of tx.gasPrice;

    const cancelTxPayload = {
      gasPrice: toHex(rawGasPrice),
      nonce: tx.nonce,
      to: accountAddress,
    };

    try {
      const originalHash = tx.hash;
      const hash = await sendTransaction({
        transaction: cancelTxPayload,
      });
      const updatedTx = { ...tx };
      // Update the hash on the copy of the original tx
      updatedTx.hash = hash;
      updatedTx.status = TransactionStatusTypes.cancelling;
      updatedTx.title = getTitle(updatedTx);
      dispatch(dataUpdateTransaction(originalHash, updatedTx));
    } catch (e) {
      logger.log('Error submitting cancel tx', e);
    } finally {
      goBack();
    }
  }, [accountAddress, dispatch, goBack, selectedGasPrice, tx]);

  const handleSpeedUp = useCallback(async () => {
    const rawGasPrice = get(selectedGasPrice, 'value.amount');

    // TODO - Check that rawGasPrice is >= 1.1x of tx.gasPrice;

    const fasterTxPayload = {
      data: tx.data,
      gasLimit: tx.gasLimit,
      gasPrice: toHex(rawGasPrice),
      nonce: tx.nonce,
      to: tx.to,
    };

    try {
      const originalHash = tx.hash;
      const hash = await sendTransaction({
        transaction: fasterTxPayload,
      });
      const updatedTx = { ...tx };
      // Update the hash on the copy of the original tx
      updatedTx.hash = hash;
      updatedTx.status = TransactionStatusTypes.speeding_up;
      updatedTx.title = getTitle(updatedTx);
      dispatch(dataUpdateTransaction(originalHash, updatedTx));
    } catch (e) {
      logger.log('Error submitting cancel tx', e);
    } finally {
      goBack();
    }
  }, [dispatch, goBack, selectedGasPrice, tx]);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      startPollingGasPrices();
      // Always default to fast
      updateGasPriceOption('fast');
    });
    return () => {
      stopPollingGasPrices();
    };
  }, [startPollingGasPrices, stopPollingGasPrices, updateGasPriceOption]);

  useEffect(() => {
    if (!isEmpty(gasPrices) && !calculatingGasLimit.current) {
      updateTxFee(tx.gasLimit);
    }
  }, [gasPrices, tx, tx.gasLimit, updateTxFee]);

  const handleCustomGasFocus = useCallback(() => {
    setKeyboardVisible(true);
  }, []);
  const handleCustomGasBlur = useCallback(() => {
    setKeyboardVisible(false);
  }, []);

  const offset = useSharedValue(0);
  const sheetOpacity = useSharedValue(1);
  const animatedContainerStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: offset.value }],
    };
  });
  const animatedSheetStyles = useAnimatedStyle(() => {
    return {
      opacity: sheetOpacity.value,
    };
  });

  const fallbackStyles = {
    marginBottom: keyboardVisible ? keyboardHeight : 0,
  };

  useEffect(() => {
    if (keyboardVisible) {
      offset.value = withSpring(
        -keyboardHeight + safeAreaInsetValues.bottom,
        springConfig
      );
      sheetOpacity.value = withSpring(android ? 0.8 : 0.3, springConfig);
    } else {
      offset.value = withSpring(0, springConfig);
      sheetOpacity.value = withSpring(1, springConfig);
    }
  }, [keyboardHeight, keyboardVisible, offset, sheetOpacity]);
  const sheetHeight =
    (type === CANCEL_TX ? 770 : 720) + safeAreaInsetValues.bottom;

  const marginTop = android ? deviceHeight - sheetHeight + 210 : null;

  return (
    <AnimatedContainer
      style={isReanimatedAvailable ? animatedContainerStyles : fallbackStyles}
    >
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
            direction="column"
            marginTop={marginTop}
            paddingBottom={0}
            paddingTop={24}
            style={animatedSheetStyles}
          >
            <SheetHandleFixedToTop showBlur={false} />
            <Column marginBottom={17} />
            <Centered direction="column" paddingTop={9}>
              <Column marginBottom={15}>
                <Emoji
                  name={type === CANCEL_TX ? 'skull_and_crossbones' : 'rocket'}
                  size="h1"
                />
              </Column>
              <Column marginBottom={12}>
                <Text
                  color={colors.blueGreyDarker}
                  lineHeight="paragraphSmall"
                  size="larger"
                  weight="bold"
                >
                  {title[type]}
                </Text>
              </Column>
              <Column marginBottom={56} paddingLeft={60} paddingRight={60}>
                <Text
                  align="center"
                  color={colors.alpha(colors.blueGreyDark, 0.5)}
                  lineHeight="paragraphSmall"
                  size="large"
                  weight="normal"
                >
                  {text[type]}
                </Text>
              </Column>

              {type === CANCEL_TX && (
                <Column>
                  <SheetActionButtonRow ignorePaddingTop>
                    <SheetActionButton
                      color={colors.red}
                      label="􀎽 Attempt Cancellation"
                      onPress={handleCancellation}
                      size="big"
                      textColor={colors.white}
                      weight="heavy"
                    />
                  </SheetActionButtonRow>
                  <SheetActionButtonRow ignorePaddingTop>
                    <SheetActionButton
                      color={colors.white}
                      label="Cancel"
                      onPress={goBack}
                      size="big"
                      textColor={colors.alpha(colors.blueGreyDark, 0.8)}
                      weight="heavy"
                    />
                  </SheetActionButtonRow>
                </Column>
              )}
              {type === SPEED_UP && (
                <SheetActionButtonRow ignorePaddingTop>
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
