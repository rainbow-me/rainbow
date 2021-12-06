import React from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { Row } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const Container = styled(Row).attrs({
  align: 'center',
  scaleTo: 0.97,
})`
  ${padding(0, 19)};
  height: 49;
`;

const WalletOption = ({ editMode, label, onPress }: any) => {
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container as={ButtonPressAnimation} disabled={editMode} onPress={onPress}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text
        color={
          editMode ? colors.alpha(colors.blueGreyDark, 0.2) : colors.appleBlue
        }
        letterSpacing="roundedMedium"
        size="lmedium"
        weight="bold"
      >
        {label}
      </Text>
    </Container>
  );
};

export default React.memo(WalletOption);
