import PropTypes from 'prop-types';
import React from 'react';
import { withProps } from 'recompact';
import { useDimensions } from '../../hooks';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, FlexItem, Row } from '../layout';
import { Text } from '../text';

const KeyColor = colors.alpha(colors.blueGreyDark, 0.8);
const defaultTransform = { transform: [{ scale: 0.5 }] };

const KeyboardButton = ({ children, ...props }) => {
  const { isTinyPhone } = useDimensions();
  const keyHeight = isTinyPhone ? 60 : 64;
  const yTransformOrigin = 0.5 + 8 / keyHeight;

  return (
    <ButtonPressAnimation
      {...props}
      duration={35}
      pressOutDuration={75}
      scaleTo={1.6}
      transformOrigin={[0.5, yTransformOrigin]}
    >
      <Centered height={keyHeight} style={defaultTransform} width={80}>
        {children}
      </Centered>
    </ButtonPressAnimation>
  );
};

const KeyboardRow = withProps({
  align: 'center',
  justify: 'space-between',
  width: '100%',
})(Row);

const Numpad = ({ decimal, onPress, width }) => {
  const renderCell = symbol => (
    <KeyboardButton key={symbol} onPress={() => onPress(symbol.toString())}>
      <Text align="center" color={KeyColor} size={44} weight="bold">
        {symbol}
      </Text>
    </KeyboardButton>
  );

  const renderRow = cells => <KeyboardRow>{cells.map(renderCell)}</KeyboardRow>;

  return (
    <Centered direction="column" width={width}>
      {renderRow([1, 2, 3])}
      {renderRow([4, 5, 6])}
      {renderRow([7, 8, 9])}
      <KeyboardRow>
        {decimal ? renderCell('.') : <FlexItem />}
        {renderCell(0)}
        <KeyboardButton onPress={() => onPress('back')}>
          <Icon align="center" color={KeyColor} name="backspace" width={40} />
        </KeyboardButton>
      </KeyboardRow>
    </Centered>
  );
};

Numpad.propTypes = {
  decimal: PropTypes.bool,
  onPress: PropTypes.func.isRequired,
  width: PropTypes.number,
};

Numpad.defaultProps = {
  decimal: true,
};

const neverRerender = () => true;

export default React.memo(Numpad, neverRerender);
