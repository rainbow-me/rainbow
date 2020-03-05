import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, useCallback, useState } from 'react';
import Animated from 'react-native-reanimated';
import { useDimensions } from '../../hooks';
import { padding } from '../../styles';
import { runSpring } from '../animations';
import { Centered, ColumnWithMargins } from '../layout';
import { Numpad, NumpadValue } from '../numpad';
import AddCashFooter from './AddCashFooter';
import AddCashSelector from './AddCashSelector';

const { Clock } = Animated;

const currencies = ['DAI', 'ETH'];
const initialCurrencyIndex = 0;

const AddCashForm = ({
  limitDaily,
  limitYearly,
  onClearError,
  onLimitExceeded,
  onPurchase,
  onShake,
  shakeAnim,
}) => {
  const { isNarrowPhone } = useDimensions();
  const [scaleAnim, setScaleAnim] = useState(1);
  const [currency, setCurrency] = useState(currencies[initialCurrencyIndex]);
  const [value, setValue] = useState(null);

  console.log('limitYearly', limitYearly);

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
          onShake();
          return prevText;
        } else curText = val;
      } else if (isNaN(val)) {
        if (val === 'back') {
          onClearError();
          curText = curText.slice(0, -1);
        } else if (curText.includes('.')) {
          onShake();
          return prevText;
        } else curText += val;
      } else {
        if (curText.charAt(curText.length - 3) === '.') {
          onShake();
          return prevText;
        } else if (curText + val <= limitDaily) {
          curText += val;
        } else {
          onLimitExceeded('daily');
          onShake();
          return prevText;
        }
      }
      let prevPosition = 1;
      if (prevText && prevText.length > 3) {
        prevPosition = 1 - (prevText.length - 3) * 0.075;
      }
      if (curText.length > 3) {
        const characterCount = 1 - (curText.length - 3) * 0.075;
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
        <Centered maxWidth={313}>
          <Numpad
            onPress={handleNumpadPress}
            width={isNarrowPhone ? 275 : '100%'}
          />
        </Centered>
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
  onLimitExceeded: PropTypes.func,
  onPurchase: PropTypes.func,
};

export default React.memo(AddCashForm);
