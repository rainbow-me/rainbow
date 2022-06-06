import lang from 'i18n-js';
import { isEmpty, toLower } from 'lodash';
import LottieView from 'lottie-react-native';
import React, { Fragment, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, FadeOut, Keyframe } from 'react-native-reanimated';
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
  ADD_CASH_DISPLAYED_STATUS_TYPES,
  WYRE_ORDER_STATUS_TYPES,
} from '@rainbow-me/helpers/wyreStatusTypes';
import { useDimensions, useTimeout } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation/Navigation';
import { ETH_ADDRESS, getWyreErrorOverride } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';

const OrderIdText = styled(Text).attrs({
  align: 'center',
  lineHeight: 20,
  size: 18,
  weight: 'bold',
})({});

const StatusMessageText = styled(Text).attrs({
  align: 'center',
  lineHeight: 30,
  size: 23,
  weight: 'bold',
})({});

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

const duration = 150;

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
          {lang.t('wallet.add_cash.purchase_failed_title')} <Br />
          {lang.t('wallet.add_cash.purchase_failed_subtitle')}
        </StatusMessageText>
      )}
      {orderId && (
        <OrderIdText>
          <Br />
          {lang.t('wallet.add_cash.purchase_failed_order_id', {
            orderId,
          })}
        </OrderIdText>
      )}
      <Row>
        <SupportButton
          label={lang.t('button.try_again')}
          marginTop={24}
          onPress={resetAddCashForm}
        />

        <NeedHelpButton
          marginLeft={10}
          marginTop={24}
          subject={
            orderId
              ? lang.t(
                  'wallet.add_cash.purchase_failed_support_subject_with_order_id',
                  { orderId }
                )
              : lang.t('wallet.add_cash.purchase_failed_support_subject')
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
    <StatusMessageText>
      {lang.t('wallet.add_cash.running_checks')}
    </StatusMessageText>
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
        {lang.t('wallet.add_cash.on_the_way_line_1', {
          currencySymbol: currency.toUpperCase(),
        })}{' '}
        <Br />
        {lang.t('wallet.add_cash.on_the_way_line_2')}
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
      <StatusMessageText>
        {lang.t('wallet.add_cash.success_message')}
      </StatusMessageText>
    </Content>
  );
};

const keyframe = new Keyframe({
  0: {
    easing: Easing.in(Easing.ease),
    opacity: 0,
    transform: [{ scale: 0.0001 }],
  },
  100: {
    easing: Easing.in(Easing.ease),
    opacity: 1,
    transform: [{ scale: 1 }],
  },
});

const AddCashStatus = ({
  error,
  orderCurrency,
  orderId,
  orderStatus,
  resetAddCashForm,
  transferStatus,
}) => {
  const status = useMemo(() => {
    if (
      orderStatus === WYRE_ORDER_STATUS_TYPES.success ||
      transferStatus === TransactionStatusTypes.purchased
    ) {
      return ADD_CASH_DISPLAYED_STATUS_TYPES.success;
    }

    if (
      orderStatus === WYRE_ORDER_STATUS_TYPES.failed ||
      transferStatus === TransactionStatusTypes.failed
    ) {
      return ADD_CASH_DISPLAYED_STATUS_TYPES.failed;
    }

    if (orderStatus === WYRE_ORDER_STATUS_TYPES.pending) {
      return ADD_CASH_DISPLAYED_STATUS_TYPES.pending;
    }

    return ADD_CASH_DISPLAYED_STATUS_TYPES.checking;
  }, [orderStatus, transferStatus]);

  const currency = toLower(orderCurrency || 'ETH');

  const updatedError = useMemo(() => {
    return getWyreErrorOverride(error);
  }, [error]);

  return (
    <Animated.View
      entering={keyframe.duration(duration)}
      exiting={FadeOut.duration(duration).easing(Easing.out(Easing.ease))}
      style={sx.container}
    >
      {status === ADD_CASH_DISPLAYED_STATUS_TYPES.failed ? (
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
          {status === ADD_CASH_DISPLAYED_STATUS_TYPES.success ? (
            <AddCashSuccess currency={currency} />
          ) : status === ADD_CASH_DISPLAYED_STATUS_TYPES.pending ? (
            <AddCashPending currency={currency} />
          ) : (
            <AddCashChecking />
          )}
        </FloatingEmojisTapper>
      )}
    </Animated.View>
  );
};

export default React.memo(AddCashStatus);
