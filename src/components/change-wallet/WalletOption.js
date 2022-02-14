import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { Row } from '../layout';
import { Text } from '../text';
import styled from '@rainbow-me/styled-components';
import { padding } from '@rainbow-me/styles';

const Container = styled(Row).attrs({
  align: 'center',
  scaleTo: 0.97,
})({
  ...padding.object(0, 19),
  height: 49,
});

const WalletOption = ({ editMode, label, onPress }) => {
  const { colors } = useTheme();
  return (
    <Container as={ButtonPressAnimation} disabled={editMode} onPress={onPress}>
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
