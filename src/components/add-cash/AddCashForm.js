import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, useCallback, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useDimensions } from '../../hooks';
import { padding } from '../../styles';
import { Centered, ColumnWithMargins } from '../layout';
import { Numpad, NumpadValue } from '../numpad';
import AddCashFooter from './AddCashFooter';
import AddCashSelector from './AddCashSelector';

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

const shakeAnimation = () => runSpring(new Clock(), -10, 0, -1000, 5500, 35);

const currencies = ['DAI', 'ETH'];
const initialCurrencyIndex = 0;

const AddCashForm = ({ limitDaily, limitYearly, onPurchase }) => {
  const { isNarrowPhone } = useDimensions();

  console.log('limitYearly', limitYearly);

  const [scaleAnim, setScaleAnim] = useState(1);
  const [shakeAnim, setShakeAnim] = useState(0);

  const [currency, setCurrency] = useState(currencies[initialCurrencyIndex]);
  const [value, setValue] = useState(null);

  const handlePurchase = useCallback(() => onPurchase({ currency, value }), [
    currency,
    onPurchase,
    value,
  ]);

  const handleNumpadPress = val =>
    setValue(prevText => {
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

  return (
    <Fragment>
      <Centered flex={1}>
        <ColumnWithMargins
          align="center"
          css={padding(0, 24, isNarrowPhone ? 0 : 24)}
          justify="center"
          margin={8}
          width="100%"
        >
          <NumpadValue scale={scaleAnim} translateX={shakeAnim} value={value} />
          <AddCashSelector
            currencies={currencies}
            initialCurrencyIndex={initialCurrencyIndex}
            onSelect={setCurrency}
          />
        </ColumnWithMargins>
      </Centered>
      <ColumnWithMargins align="center" margin={15}>
        <View style={{ maxWidth: 313 }}>
          <Numpad
            onPress={handleNumpadPress}
            width={isNarrowPhone ? 275 : '100%'}
          />
        </View>
        <AddCashFooter
          disabled={isEmpty(value) || parseFloat(value) === 0}
          onSubmit={handlePurchase}
        />
      </ColumnWithMargins>
    </Fragment>
  );
};

AddCashForm.propTypes = {
  limitDaily: PropTypes.number,
  limitYearly: PropTypes.number,
  onPurchase: PropTypes.func,
};

export default React.memo(AddCashForm);
