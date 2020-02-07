import MaskedView from '@react-native-community/masked-view';
import { isEmpty, toLower } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, useState } from 'react';
import { View } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import Animated from 'react-native-reanimated';
import { withNavigation } from 'react-navigation';
import { compose, withProps } from 'recompact';
import { ApplePayButton, VirtualKeyboard } from '../../components/add-cash';
import { Centered, ColumnWithMargins } from '../../components/layout';
import {
  requestWyreApplePay,
  trackWyreOrder,
  trackWyreTransfer,
} from '../../handlers/wyre';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import TransactionTypes from '../../helpers/transactionTypes';
import {
  WYRE_ORDER_STATUS_TYPES,
  WYRE_TRANSFER_STATUS_TYPES,
} from '../../helpers/wyreStatusTypes';
import {
  withAccountAddress,
  withAccountData,
  withTransitionProps,
} from '../../hoc';
import { AddCashCurrencies, AddCashCurrencyInfo } from '../../references';
import { colors, padding } from '../../styles';
import { deviceUtils, ethereumUtils, safeAreaInsetValues } from '../../utils';
import AddCashSelector from '../../components/add-cash/AddCashSelector';
import { Text } from '../text';

const {
  set,
  cond,
  startClock,
  clockRunning,
  block,
  spring,
  Value,
  Clock,
} = Animated;

function runSpring(clock, value, dest, velocity, stiffness, damping) {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    velocity: new Value(0),
  };

  const config = {
    damping: new Value(0),
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
    stiffness: new Value(0),
    toValue: new Value(0),
  };

  return block([
    cond(clockRunning(clock), 0, [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.position, value),
      set(state.velocity, velocity),
      set(config.toValue, dest),
      set(config.damping, damping),
      set(config.stiffness, stiffness),
      startClock(clock),
    ]),
    spring(clock, state, config),
    state.position,
  ]);
}

const cashFontSize = deviceUtils.dimensions.width * 0.24;
const isTinyIphone = deviceUtils.dimensions.width < 375 ? true : false;
const keyboardWidth = isTinyIphone ? 275 : '100%';

const gradientXPoint = deviceUtils.dimensions.width - 48;
const gradientPoints = [gradientXPoint, 53.5];

const shakeAnimation = () => runSpring(new Clock(), -10, 0, -1000, 5500, 35);

const currencies = ['ETH', 'DAI'];
const initialCurrencyIndex = 0;

const AddCashForm = ({
  accountAddress,
  assets,
  dataAddNewTransaction,
  // limitAnnually,
  limitDaily,
  transferHash,
  setOrderStatus,
  setTransferHash,
  setTransferStatus,
}) => {
  const [scaleAnim, setScaleAnim] = useState(1);
  const [shakeAnim, setShakeAnim] = useState(0);
  const [text, setText] = useState(null);
  const [destCurrency, setDestCurrency] = useState(
    currencies[initialCurrencyIndex]
  );

  const wyreOrderStatus = async orderId => {
    try {
      const { orderStatus, transferId } = await trackWyreOrder(orderId);
      setOrderStatus(orderStatus);
      if (transferId) {
        wyreTransferHash(transferId);
      } else {
        if (orderStatus !== WYRE_ORDER_STATUS_TYPES.failed) {
          setTimeout(() => wyreOrderStatus(orderId), 1000);
        }
      }
    } catch (error) {
      setTimeout(() => wyreOrderStatus(orderId), 1000);
    }
  };

  const wyreTransferHash = async transferId => {
    try {
      const {
        destAmount,
        destCurrency,
        transferHash,
        transferStatus,
      } = await trackWyreTransfer(transferId);
      setTransferStatus(transferStatus);
      const destAssetAddress = toLower(AddCashCurrencies[destCurrency]);
      if (!transferHash) {
        setTimeout(() => wyreTransferHash(transferId), 1000);
      } else {
        setTransferHash(transferHash);
        let asset = ethereumUtils.getAsset(assets, destAssetAddress);
        if (!asset) {
          asset = AddCashCurrencyInfo[destAssetAddress];
          // TODO JIN fetch the price
        }
        const txDetails = {
          amount: destAmount,
          asset,
          from: null,
          hash: transferHash,
          nonce: null,
          status: TransactionStatusTypes.purchasing,
          to: accountAddress,
          type: TransactionTypes.purchase,
        };
        dataAddNewTransaction(txDetails);
        // TODO JIN save the transferHash into local storage
        wyreTransferStatus(transferId);
      }
    } catch (error) {
      setTimeout(() => wyreTransferHash(transferId), 1000);
    }
  };

  // TODO JIN kill set timeouts if unmounted
  const wyreTransferStatus = async transferId => {
    try {
      const { transferStatus } = await trackWyreTransfer(transferId);
      setTransferStatus(transferStatus);
      if (
        transferStatus === WYRE_TRANSFER_STATUS_TYPES.success ||
        transferStatus === WYRE_TRANSFER_STATUS_TYPES.failed
      ) {
        setTransferHash(transferHash);
        setTransferStatus(transferStatus);
      } else {
        setTimeout(() => wyreTransferStatus(transferId), 10000);
      }
    } catch (error) {
      setTimeout(() => wyreTransferStatus(transferId), 1000);
    }
  };

  const onPress = val =>
    setText(prevText => {
      let curText = prevText;
      if (!curText) {
        if (val === '0' || isNaN(val)) {
          setShakeAnim(shakeAnimation());
          return prevText;
        } else curText = val;
      } else if (isNaN(val)) {
        if (val === 'back') {
          curText = curText.slice(0, -1);
        } else if (curText.includes('.')) {
          setShakeAnim(shakeAnimation());
          return prevText;
        } else curText += val;
      } else {
        if (curText.charAt(curText.length - 3) === '.') {
          setShakeAnim(shakeAnimation());
          return prevText;
        } else if (curText + val <= limitDaily) {
          curText += val;
        } else {
          setShakeAnim(shakeAnimation());
          return prevText;
        }
      }
      let prevPosition = 1;
      if (prevText && prevText.length > 3) {
        prevPosition = 1 - (prevText.length - 3) * 0.075;
      }
      if (curText.length > 3) {
        let characterCount = 1 - (curText.length - 3) * 0.075;
        setScaleAnim(
          runSpring(new Clock(), prevPosition, characterCount, 0, 400, 40)
        );
      } else if (curText.length == 3) {
        setScaleAnim(runSpring(new Clock(), prevPosition, 1, 0, 400, 40));
      }
      return curText;
    });

  const onSubmit = () =>
    requestWyreApplePay(accountAddress, destCurrency, text, wyreOrderStatus);

  const disabled = isEmpty(text) || parseFloat(text) === 0;

  return (
    <Fragment>
      <ColumnWithMargins
        align="center"
        css={padding(0, 24, isTinyIphone ? 0 : 24)}
        margin={8}
        width="100%"
      >
        <MaskedView
          width="100%"
          maskElement={
            <Animated.View>
              <Animated.Text
                style={{
                  color: colors.white,
                  fontFamily: 'SF Pro Rounded',
                  fontSize: cashFontSize,
                  fontWeight: 'bold',
                  left: '-50%',
                  lineHeight: 108,
                  textAlign: 'center',
                  transform: [
                    {
                      scale: scaleAnim,
                      translateX: shakeAnim,
                    },
                  ],
                  width: '200%',
                }}
              >
                {'$' + (text ? text : '0')}
              </Animated.Text>
            </Animated.View>
          }
        >
          <RadialGradient
            center={gradientPoints}
            colors={['#FFB114', '#FF54BB', '#00F0FF', '#34F3FF']}
            radius={gradientXPoint}
            style={{ height: 108, width: '100%' }}
            stops={[0.2049, 0.6354, 0.8318, 0.9541]}
          />
        </MaskedView>

        <AddCashSelector
          currencies={currencies}
          initialCurrencyIndex={initialCurrencyIndex}
          onSelect={setDestCurrency}
        />
      </ColumnWithMargins>

      <ColumnWithMargins align="center" margin={15}>
        <View style={{ maxWidth: 313 }}>
          <VirtualKeyboard
            decimal
            rowStyle={{ width: keyboardWidth }}
            onPress={val => onPress(val)}
          />
        </View>
        <Centered
          css={padding(
            isTinyIphone ? 4 : 24,
            15,
            isTinyIphone ? 15 : safeAreaInsetValues.bottom + 21
          )}
          width="100%"
        >
          <ApplePayButton disabled={disabled} onSubmit={onSubmit} />
          <Text>🇺🇸 US debit cards only</Text>
        </Centered>
      </ColumnWithMargins>
    </Fragment>
  );
};

AddCashForm.propTypes = {
  accountAddress: PropTypes.string,
  assets: PropTypes.array,
  dataAddNewTransaction: PropTypes.func,
  // limitAnnually: PropTypes.number,
  limitDaily: PropTypes.number,
};

export default compose(
  withAccountData,
  withAccountAddress,
  withNavigation,
  withTransitionProps,
  withProps(({ transitionProps: { isTransitioning } }) => ({
    isTransitioning,
  }))
)(AddCashForm);
