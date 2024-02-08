import React, { useCallback } from 'react';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, Column, Row } from '../layout';
import { Text } from '../text';
import { useDimensions } from '@/hooks';
import styled from '@/styled-thing';
import { useTheme } from '@/theme';

const KeyboardButtonContent = styled(Centered)({
  height: ({ height }) => height,
  transform: [{ scale: 0.5 }],
  width: 80,
});

const KeyboardRow = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})({
  width: '100%',
});

const KeyboardButton = ({ children, ...props }) => {
  const { isTinyPhone } = useDimensions();
  const keyHeight = isTinyPhone ? 60 : 64;

  return (
    <ButtonPressAnimation {...props} duration={35} pressOutDuration={75} scaleTo={1.6} transformOrigin={[0.5, 0.5 + 8 / keyHeight]}>
      <KeyboardButtonContent height={keyHeight}>{children}</KeyboardButtonContent>
    </ButtonPressAnimation>
  );
};

export default function Numpad({ decimal = true, onPress, width }) {
  const { colors } = useTheme();
  const keyColor = colors.alpha(colors.blueGreyDark, 0.8);

  const renderCell = useCallback(
    symbol => (
      <KeyboardButton key={symbol} onPress={() => onPress(symbol.toString())} testID={`numpad-button-${symbol}`}>
        <Text align="center" color={keyColor} size={44} weight="bold">
          {symbol}
        </Text>
      </KeyboardButton>
    ),
    [keyColor, onPress]
  );

  const renderRow = useCallback(cells => <KeyboardRow>{cells.map(renderCell)}</KeyboardRow>, [renderCell]);

  return (
    <Centered direction="column" width={width}>
      {renderRow([1, 2, 3])}
      {renderRow([4, 5, 6])}
      {renderRow([7, 8, 9])}
      <KeyboardRow>
        {decimal ? renderCell('.') : <Column width={80} />}
        {renderCell(0)}
        <KeyboardButton onPress={() => onPress('back')}>
          <Icon align="center" color={keyColor} name="backspace" width={40} />
        </KeyboardButton>
      </KeyboardRow>
    </Centered>
  );
}
