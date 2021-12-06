import { isEmpty, toLower } from 'lodash';
import LottieView from 'lottie-react-native';
import React, { Fragment, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(2732) FIXME: Cannot find module '../../assets/lottie/jumping-da... Remove this comment to see the full error message
import jumpingDaiAnimation from '../../assets/lottie/jumping-dai.json';
// @ts-expect-error ts-migrate(2732) FIXME: Cannot find module '../../assets/lottie/jumping-et... Remove this comment to see the full error message
import jumpingEthAnimation from '../../assets/lottie/jumping-eth.json';
import { CoinIcon } from '../coin-icon';
import { FloatingEmojisTapper } from '../floating-emojis';
import { Centered, Row } from '../layout';
import { Br, Emoji, Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './NeedHelpButton' was resolved to '/Users/... Remove this comment to see the full error message
import NeedHelpButton from './NeedHelpButton';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SupportButton' was resolved to '/Users/n... Remove this comment to see the full error message
import SupportButton from './SupportButton';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { TransactionStatusTypes } from '@rainbow-me/entities';
import {
  ADD_CASH_STATUS_TYPES,
  WYRE_ORDER_STATUS_TYPES,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/wyreStatus... Remove this comment to see the full error message
} from '@rainbow-me/helpers/wyreStatusTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions, usePrevious, useTimeout } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation/Navigat... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation/Navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { ETH_ADDRESS, getWyreErrorOverride } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
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
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Transition.Sequence>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Transition.Out
      durationMs={duration / 2}
      interpolation="easeIn"
      propagation="bottom"
      type="fade"
    />
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Transition.Change durationMs={duration} interpolation="easeInOut" />
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Transition.Together>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Transition.In
        delayMs={duration / 3}
        durationMs={duration}
        interpolation="easeOut"
        propagation="top"
        type="fade"
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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

const Content = (props: any) => {
  const { width } = useDimensions();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Centered
      {...props}
      direction="column"
      flex={1}
      style={sx.content}
      width={width}
    />
  );
};

const AddCashFailed = ({ error, orderId, resetAddCashForm }: any) => {
  const { errorMessage } = error;
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Content>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered height={85}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Emoji name="cry" size={50} />
      </Centered>
      {!isEmpty(errorMessage) ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <StatusMessageText>{errorMessage}</StatusMessageText>
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <StatusMessageText>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message Sorry, your purchase failed. <Br />
          You were not charged.
        </StatusMessageText>
      )}
      {orderId && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <OrderIdText>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Br />
          Order ID: {orderId}
        </OrderIdText>
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SupportButton
          label="Try again"
          marginTop={24}
          onPress={resetAddCashForm}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Content>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Centered height={85}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Emoji name="bank" size={50} />
    </Centered>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <StatusMessageText>Running checks...</StatusMessageText>
  </Content>
);

const AddCashPending = ({ currency }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Fragment>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Content>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered height={85}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <LottieView
          autoPlay
          loop
          source={
            currency === ETH_ADDRESS ? jumpingEthAnimation : jumpingDaiAnimation
          }
          style={{ height: 263 }}
        />
      </Centered>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <StatusMessageText>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message Your {currency.toUpperCase()} is on the way <Br />
        and will arrive shortly
      </StatusMessageText>
    </Content>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Centered>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NeedHelpButton />
    </Centered>
  </Fragment>
);

const AddCashSuccess = ({ currency }: any) => {
  const { navigate } = useNavigation();
  const [startTimeout] = useTimeout();

  startTimeout(() => navigate(Routes.WALLET_SCREEN), 2696.9);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Content>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered paddingBottom={19}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <CoinIcon size={60} symbol={currency} />
      </Centered>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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
}: any) => {
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
      // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
      if (ref.current) ref.current.animateNextTransition();
    }
  }, [previousStatus, status]);

  const currency = toLower(orderCurrency || 'ETH');

  const updatedError = useMemo(() => {
    return getWyreErrorOverride(error);
  }, [error]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Transitioning.View ref={ref} style={sx.container} transition={transition}>
      {status === ADD_CASH_STATUS_TYPES.failed ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <AddCashFailed
          error={updatedError}
          orderId={orderId}
          resetAddCashForm={resetAddCashForm}
        />
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <FloatingEmojisTapper
          {...position.centeredAsObject}
          emojis={['money_with_wings']}
          flex={1}
        >
          {status === ADD_CASH_STATUS_TYPES.success ? (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <AddCashSuccess currency={currency} />
          ) : status === ADD_CASH_STATUS_TYPES.pending ? (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <AddCashPending currency={currency} />
          ) : (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <AddCashChecking />
          )}
        </FloatingEmojisTapper>
      )}
    </Transitioning.View>
  );
};

export default React.memo(AddCashStatus);
