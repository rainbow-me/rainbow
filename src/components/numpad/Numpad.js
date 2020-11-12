import React, { useCallback } from 'react';
import styled from 'styled-components/primitives';
import { useDimensions } from '../../hooks';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, Column, Row } from '../layout';
import { Text } from '../text';
import { colors } from '@rainbow-me/styles';

const KeyColor = colors.alpha(colors.blueGreyDark, 0.8);

const KeyboardButtonContent = styled(Centered)`
  height: ${({ height }) => height};
  transform: scale(0.5);
  width: 80;
`;

const KeyboardRow = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  width: 100%;
`;

const KeyboardButton = ({ children, ...props }) => {
  const { isTinyPhone } = useDimensions();
  const keyHeight = isTinyPhone ? 60 : 64;

  return (
    <ButtonPressAnimation
      {...props}
      duration={35}
      pressOutDuration={75}
      scaleTo={1.6}
      transformOrigin={[0.5, 0.5 + 8 / keyHeight]}
    >
      <KeyboardButtonContent height={keyHeight}>
        {children}
      </KeyboardButtonContent>
    </ButtonPressAnimation>
  );
};

const Numpad = ({ decimal = true, onPress, width }) => {
  const renderCell = useCallback(
    symbol => (
      <KeyboardButton
        key={symbol}
        onPress={() => onPress(symbol.toString())}
        testID={`numpad-button-${symbol}`}
      >
        <Text align="center" color={KeyColor} size={44} weight="bold">
          {symbol}
        </Text>
      </KeyboardButton>
    ),
    [onPress]
  );

  const renderRow = useCallback(
    cells => <KeyboardRow>{cells.map(renderCell)}</KeyboardRow>,
    [renderCell]
  );

  return (
    <Centered direction="column" width={width}>
      {renderRow([1, 2, 3])}
      {renderRow([4, 5, 6])}
      {renderRow([7, 8, 9])}
      <KeyboardRow>
        {decimal ? renderCell('.') : <Column width={80} />}
        {renderCell(0)}
        <KeyboardButton onPress={() => onPress('back')}>
          <Icon align="center" color={KeyColor} name="backspace" width={40} />
        </KeyboardButton>
      </KeyboardRow>
    </Centered>
  );
};

export default Numpad;
