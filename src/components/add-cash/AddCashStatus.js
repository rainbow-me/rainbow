import { isEmpty, toLower } from 'lodash';
import LottieView from 'lottie-react-native';
import PropTypes from 'prop-types';
import React, { Fragment, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';
import { withProps } from 'recompact';
import jumpingDaiAnimation from '../../assets/lottie/jumping-dai.json';
import jumpingEthAnimation from '../../assets/lottie/jumping-eth.json';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import {
  ADD_CASH_STATUS_TYPES,
  WYRE_ORDER_STATUS_TYPES,
} from '../../helpers/wyreStatusTypes';
import { useDimensions, usePrevious, useTimeout } from '../../hooks';
import { useNavigation } from '../../navigation/Navigation';
import { getErrorOverride } from '../../references/wyre';
import { CoinIcon } from '../coin-icon';
import { FloatingEmojisTapper } from '../floating-emojis';
import { Centered } from '../layout';
import { Br, Emoji, Text } from '../text';
import NeedHelpButton from './NeedHelpButton';
import SupportButton from './SupportButton';
import Routes from '@rainbow-me/routes';
import { position } from '@rainbow-me/styles';

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

const AddCashFailed = ({ error, resetAddCashForm }) => {
  const { errorMessage, tryAgain } = error;
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
      {tryAgain ? (
        <SupportButton
          label="Try again"
          marginTop={24}
          onPress={resetAddCashForm}
        />
      ) : (
        <NeedHelpButton marginTop={24} subject="Purchase Failed" />
      )}
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
            currency === 'eth' ? jumpingEthAnimation : jumpingDaiAnimation
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
    return getErrorOverride(error);
  }, [error]);

  return (
    <Transitioning.View ref={ref} style={sx.container} transition={transition}>
      {status === ADD_CASH_STATUS_TYPES.failed ? (
        <AddCashFailed
          error={updatedError}
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

AddCashStatus.propTypes = {
  error: PropTypes.object,
  orderCurrency: PropTypes.string.isRequired,
  orderStatus: PropTypes.string,
  resetAddCashForm: PropTypes.func,
  transferStatus: PropTypes.string,
};

export default React.memo(AddCashStatus);
