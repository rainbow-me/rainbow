import React, { useCallback } from 'react';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, Column, Row } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/context' or its co... Remove this comment to see the full error message
import { useTheme } from '@rainbow-me/context';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';

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

const KeyboardButton = ({ children, ...props }: any) => {
  const { isTinyPhone } = useDimensions();
  const keyHeight = isTinyPhone ? 60 : 64;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      {...props}
      duration={35}
      pressOutDuration={75}
      scaleTo={1.6}
      transformOrigin={[0.5, 0.5 + 8 / keyHeight]}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <KeyboardButtonContent height={keyHeight}>
        {children}
      </KeyboardButtonContent>
    </ButtonPressAnimation>
  );
};

export default function Numpad({ decimal = true, onPress, width }: any) {
  const { colors } = useTheme();
  const keyColor = colors.alpha(colors.blueGreyDark, 0.8);

  const renderCell = useCallback(
    symbol => (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <KeyboardButton
        key={symbol}
        onPress={() => onPress(symbol.toString())}
        testID={`numpad-button-${symbol}`}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text align="center" color={keyColor} size={44} weight="bold">
          {symbol}
        </Text>
      </KeyboardButton>
    ),
    [keyColor, onPress]
  );

  const renderRow = useCallback(
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    cells => <KeyboardRow>{cells.map(renderCell)}</KeyboardRow>,
    [renderCell]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Centered direction="column" width={width}>
      {renderRow([1, 2, 3])}
      {renderRow([4, 5, 6])}
      {renderRow([7, 8, 9])}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <KeyboardRow>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        {decimal ? renderCell('.') : <Column width={80} />}
        {renderCell(0)}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <KeyboardButton onPress={() => onPress('back')}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Icon align="center" color={keyColor} name="backspace" width={40} />
        </KeyboardButton>
      </KeyboardRow>
    </Centered>
  );
}
