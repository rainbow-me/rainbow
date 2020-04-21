import LottieView from 'lottie-react-native';
import PropTypes from 'prop-types';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';
import { useNavigation } from 'react-navigation-hooks';
import { withProps } from 'recompact';
import jumpingDaiAnimation from '../../assets/lottie/jumping-dai.json';
import jumpingEthAnimation from '../../assets/lottie/jumping-eth.json';
import {
  WYRE_ORDER_STATUS_TYPES,
  WYRE_TRANSFER_STATUS_TYPES,
} from '../../helpers/wyreStatusTypes';
import { useDimensions, useTimeout } from '../../hooks';
import { position } from '../../styles';
import { CoinIcon } from '../coin-icon';
import { FloatingEmojisTapper } from '../floating-emojis';
import { Centered } from '../layout';
import { Br, Emoji, Text } from '../text';
import NeedHelpButton from './NeedHelpButton';

const StatusMessageText = withProps({
  align: 'center',
  lineHeight: 30,
  size: 23,
  weight: 'bold',
})(Text);

const sx = StyleSheet.create({
  container: {
    ...position.sizeAsObject('100%'),
    flex: 1,
    flexDirection: 'column',
  },
  content: {
    paddingHorizontal: 19,
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

const AddCashFailed = () => (
  <Content>
    <Centered height={85}>
      <Emoji name="cry" size={50} />
    </Centered>
    <StatusMessageText>
      Sorry, your purchase failed. <Br />
      You were not charged.
    </StatusMessageText>
    <NeedHelpButton marginTop={24} subject="Purchase Failed" />
  </Content>
);

const AddCashPending = ({ currency }) => (
  <Fragment>
    <Content>
      <Centered height={85}>
        <LottieView
          autoPlay
          loop
          style={{ height: 263 }}
          source={
            currency === 'eth' ? jumpingEthAnimation : jumpingDaiAnimation
          }
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

  startTimeout(() => navigate('WalletScreen'), 2696.9);

  return (
    <Content>
      <Centered paddingBottom={19}>
        <CoinIcon size={60} symbol={currency} />
      </Centered>
      <StatusMessageText>It&#39;s here! 🥳</StatusMessageText>
    </Content>
  );
};

const AddCashStatus = ({ orderCurrency, orderStatus, transferStatus }) => {
  const ref = useRef();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (
      orderStatus === WYRE_ORDER_STATUS_TYPES.success ||
      transferStatus === WYRE_TRANSFER_STATUS_TYPES.success
    ) {
      setStatus(WYRE_TRANSFER_STATUS_TYPES.success);
      if (ref.current) ref.current.animateNextTransition();
    }

    if (
      orderStatus === WYRE_ORDER_STATUS_TYPES.failed ||
      transferStatus === WYRE_TRANSFER_STATUS_TYPES.failed
    ) {
      setStatus(WYRE_TRANSFER_STATUS_TYPES.failed);
      if (ref.current) ref.current.animateNextTransition();
    }
  }, [orderStatus, transferStatus]);

  const currency = (orderCurrency || 'ETH').toLowerCase();

  return (
    <Transitioning.View ref={ref} style={sx.container} transition={transition}>
      {status === WYRE_TRANSFER_STATUS_TYPES.failed ? (
        <AddCashFailed />
      ) : (
        <FloatingEmojisTapper
          {...position.centeredAsObject}
          emojis={['money_with_wings']}
          flex={1}
        >
          {status === WYRE_TRANSFER_STATUS_TYPES.success ? (
            <AddCashSuccess currency={currency} />
          ) : (
            <AddCashPending currency={currency} />
          )}
        </FloatingEmojisTapper>
      )}
    </Transitioning.View>
  );
};

AddCashStatus.propTypes = {
  orderCurrency: PropTypes.string.isRequired,
  orderStatus: PropTypes.string,
  transferStatus: PropTypes.string,
};

export default React.memo(AddCashStatus);
