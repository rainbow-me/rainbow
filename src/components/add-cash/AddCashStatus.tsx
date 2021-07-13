import { isEmpty, toLower } from 'lodash';
import LottieView from 'lottie-react-native';
import React, { Fragment, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';
import styled from 'styled-components';
import jumpingDaiAnimation from '../../assets/lottie/jumping-dai.json';
import jumpingEthAnimation from '../../assets/lottie/jumping-eth.json';
import { CoinIcon } from '../coin-icon';
import { FloatingEmojisTapper } from '../floating-emojis';
import { Centered, Row } from '../layout';
import { Br, Emoji, Text } from '../text';
import NeedHelpButton from './NeedHelpButton';
import SupportButton from './SupportButton';
import { TransactionStatusTypes } from '@rainbow-me/entities';
import {
  ADD_CASH_STATUS_TYPES,
  WYRE_ORDER_STATUS_TYPES,
} from '@rainbow-me/helpers/wyreStatusTypes';
import { useDimensions, usePrevious, useTimeout } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation/Navigation';
import { ETH_ADDRESS, getWyreErrorOverride } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { position } from '@rainbow-me/styles';

const OrderIdText = styled(Text).attrs({
  align: 'center',
  lineHeight: 20,
  size: 18,
  weight: 'bold',
})``;

const StatusMessageText = styled(Text).attrs({
  align: 'center',
  lineHeight: 30,
  size: 23,
  weight: 'bold',
})``;

const sx = StyleSheet.create({
  container: {
    ...position.sizeAsObject('100%'),
    flex: 1,
    flexDirection: 'column',
  },
  content: {
    paddingHorizontal: 42,
    transform: [{ translateY: -42.5 }],
  },
});

const duration = 420;
const transition = (
  <Transition.Sequence>
    <Transition.Out
      durationMs={duration / 2}
      interpolation="easeIn"
      propagation="bottom"
      type="fade"
    />
    <Transition.Change durationMs={duration} interpolation="easeInOut" />
    <Transition.Together>
      <Transition.In
        delayMs={duration / 3}
        durationMs={duration}
        interpolation="easeOut"
        propagation="top"
        type="fade"
      />
      <Transition.In
        delayMs={duration / 3}
        durationMs={duration / 3}
        interpolation="easeOut"
        propagation="top"
        type="scale"
      />
    </Transition.Together>
  </Transition.Sequence>
);

const Content = props => {
  const { width } = useDimensions();
  return (
    <Centered
      {...props}
      direction="column"
      flex={1}
      style={sx.content}
      width={width}
    />
  );
};

const AddCashFailed = ({ error, orderId, resetAddCashForm }) => {
  const { errorMessage } = error;
  return (
    <Content>
      <Centered height={85}>
        <Emoji name="cry" size={50} />
      </Centered>
      {!isEmpty(errorMessage) ? (
        <StatusMessageText>{errorMessage}</StatusMessageText>
      ) : (
        <StatusMessageText>
          Sorry, your purchase failed. <Br />
          You were not charged.
        </StatusMessageText>
      )}
      {orderId && (
        <OrderIdText>
          <Br />
          Order ID: {orderId}
        </OrderIdText>
      )}
      <Row>
        <SupportButton
          label="Try again"
          marginTop={24}
          onPress={resetAddCashForm}
        />

        <NeedHelpButton
          marginLeft={10}
          marginTop={24}
          subject={
            orderId ? `Purchase Failed - Order ${orderId}` : 'Purchase Failed'
          }
        />
      </Row>
    </Content>
  );
};

const AddCashChecking = () => (
  <Content>
    <Centered height={85}>
      <Emoji name="bank" size={50} />
    </Centered>
    <StatusMessageText>Running checks...</StatusMessageText>
  </Content>
);

const AddCashPending = ({ currency }) => (
  <Fragment>
    <Content>
      <Centered height={85}>
        <LottieView
          autoPlay
          loop
          source={
            currency === ETH_ADDRESS ? jumpingEthAnimation : jumpingDaiAnimation
          }
          style={{ height: 263 }}
        />
      </Centered>
      <StatusMessageText>
        Your {currency.toUpperCase()} is on the way <Br />
        and will arrive shortly
      </StatusMessageText>
    </Content>
    <Centered>
      <NeedHelpButton />
    </Centered>
  </Fragment>
);

const AddCashSuccess = ({ currency }) => {
  const { navigate } = useNavigation();
  const [startTimeout] = useTimeout();

  startTimeout(() => navigate(Routes.WALLET_SCREEN), 2696.9);

  return (
    <Content>
      <Centered paddingBottom={19}>
        <CoinIcon size={60} symbol={currency} />
      </Centered>
      <StatusMessageText>It&#39;s here! 🥳</StatusMessageText>
    </Content>
  );
};

const AddCashStatus = ({
  error,
  orderCurrency,
  orderId,
  orderStatus,
  resetAddCashForm,
  transferStatus,
}) => {
  const ref = useRef();

  const status = useMemo(() => {
    if (
      orderStatus === WYRE_ORDER_STATUS_TYPES.success ||
      transferStatus === TransactionStatusTypes.purchased
    ) {
      return ADD_CASH_STATUS_TYPES.success;
    }

    if (
      orderStatus === WYRE_ORDER_STATUS_TYPES.failed ||
      transferStatus === TransactionStatusTypes.failed
    ) {
      return ADD_CASH_STATUS_TYPES.failed;
    }

    if (orderStatus === WYRE_ORDER_STATUS_TYPES.pending) {
      return ADD_CASH_STATUS_TYPES.pending;
    }

    return ADD_CASH_STATUS_TYPES.checking;
  }, [orderStatus, transferStatus]);

  const previousStatus = usePrevious(status);

  useEffect(() => {
    if (status !== previousStatus) {
      if (ref.current) ref.current.animateNextTransition();
    }
  }, [previousStatus, status]);

  const currency = toLower(orderCurrency || 'ETH');

  const updatedError = useMemo(() => {
    return getWyreErrorOverride(error);
  }, [error]);

  return (
    <Transitioning.View ref={ref} style={sx.container} transition={transition}>
      {status === ADD_CASH_STATUS_TYPES.failed ? (
        <AddCashFailed
          error={updatedError}
          orderId={orderId}
          resetAddCashForm={resetAddCashForm}
        />
      ) : (
        <FloatingEmojisTapper
          {...position.centeredAsObject}
          emojis={['money_with_wings']}
          flex={1}
        >
          {status === ADD_CASH_STATUS_TYPES.success ? (
            <AddCashSuccess currency={currency} />
          ) : status === ADD_CASH_STATUS_TYPES.pending ? (
            <AddCashPending currency={currency} />
          ) : (
            <AddCashChecking />
          )}
        </FloatingEmojisTapper>
      )}
    </Transitioning.View>
  );
};

export default React.memo(AddCashStatus);
