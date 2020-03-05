import PropTypes from 'prop-types';
import React from 'react';
import { withProps } from 'recompact';
import {
  WYRE_ORDER_STATUS_TYPES,
  WYRE_TRANSFER_STATUS_TYPES,
} from '../../helpers/wyreStatusTypes';
import jumpingDaiAnimation from '../../assets/lottie/jumping-dai.json';
import jumpingEthAnimation from '../../assets/lottie/jumping-eth.json';
import { ButtonPressAnimation, TouchableScale } from '../animations';
import { Centered } from '../layout';
import { FloatingEmojisTapHandler, FloatingEmojis } from '../floating-emojis';
import { Br, Rounded } from '../text';
import { useDimensions, useEmailRainbow } from '../../hooks';
import { colors, padding, position } from '../../styles';
import LottieView from 'lottie-react-native';

const StatusMessageText = withProps({
  align: 'center',
  letterSpacing: 'looseyGoosey',
  lineHeight: 30,
  size: 23,
  weight: 'bold',
})(Rounded);

const AddCashStatus = ({ orderCurrency, orderStatus, transferStatus }) => {
  const currency = orderCurrency.toLowerCase();
  const onEmailRainbow = useEmailRainbow({ subject: 'support' });
  const { width } = useDimensions();

  const isFailed =
    orderStatus === WYRE_ORDER_STATUS_TYPES.failed ||
    transferStatus === WYRE_TRANSFER_STATUS_TYPES.failed;

  return (
    <Centered direction="column" flex={1} width="100%">
      {isFailed ? (
        <StatusMessageText>
          Sorry, the purchase failed. Contact us if you need help!
        </StatusMessageText>
      ) : (
        <FloatingEmojis
          {...position.centeredAsObject}
          distance={350}
          duration={2000}
          emoji="money_with_wings"
          flex={1}
          size={36}
          wiggleFactor={1}
        >
          {({ onNewEmoji }) => (
            <FloatingEmojisTapHandler onNewEmoji={onNewEmoji}>
              <TouchableScale activeScale={1.01}>
                <Centered
                  direction="column"
                  flex={1}
                  style={{ transform: [{ translateY: -42.5 }] }}
                  width={width}
                >
                  <Centered height={85}>
                    <LottieView
                      autoPlay
                      loop
                      style={{ height: 263 }}
                      source={
                        currency === 'eth'
                          ? jumpingEthAnimation
                          : jumpingDaiAnimation
                      }
                    />
                  </Centered>
                  <StatusMessageText>
                    Your {currency.toUpperCase()} is on the way <Br />
                    and will arrive shortly
                  </StatusMessageText>
                </Centered>
              </TouchableScale>
            </FloatingEmojisTapHandler>
          )}
        </FloatingEmojis>
      )}
      <ButtonPressAnimation onPress={onEmailRainbow} scaleTo={1.1}>
        <Centered
          backgroundColor={colors.alpha(colors.blueGreyDark, 0.06)}
          borderRadius={15}
          css={padding(5, 10)}
        >
          <Rounded
            align="center"
            color={colors.alpha(colors.blueGreyDark, 0.6)}
            letterSpacing={0.4}
            size="lmedium"
            weight="semibold"
          >
            Need help?
          </Rounded>
        </Centered>
      </ButtonPressAnimation>
    </Centered>
  );
};

AddCashStatus.propTypes = {
  orderCurrency: PropTypes.string.isRequired,
  orderStatus: PropTypes.string,
  transferStatus: PropTypes.string,
};

export default React.memo(AddCashStatus);
