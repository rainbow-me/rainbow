import React from 'react';
import styled from 'styled-components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation, OpacityToggler } from '../animations';
import { CoinIconSize } from '../coin-icon';
import { Icon } from '../icons';
import { Row } from '../layout';
import {
  borders,
  colors_NOT_REACTIVE,
  padding,
  position,
  shadow,
} from '@rainbow-me/styles';

const Container = styled.View`
  ${position.size(CoinIconSize)};
  position: ${({ isAbsolute }) => (isAbsolute ? 'absolute' : 'relative')};
  top: 0;
`;

const Content = styled(Row).attrs(({ isAbsolute }) => ({
  align: 'center',
  justify: isAbsolute ? 'end' : 'center',
}))`
  ${position.size('100%')};
`;

const CircleOutline = styled.View`
  ${borders.buildCircle(22)}
  border-color: ${colors_NOT_REACTIVE.alpha(
    colors_NOT_REACTIVE.blueGreyDark,
    0.12
  )};
  border-width: 1.5;
  position: absolute;
`;

const CheckmarkBackground = styled.View`
  ${borders.buildCircle(22)}
  ${padding(4.5)}
  ${({ isDarkMode }) =>
    shadow.build(
      0,
      4,
      12,
      isDarkMode ? colors_NOT_REACTIVE.shadow : colors_NOT_REACTIVE.appleBlue,
      0.4
    )}
  background-color: ${colors_NOT_REACTIVE.appleBlue};
`;

const CoinCheckButton = ({ isAbsolute, onPress, toggle, ...props }) => {
  const { isDarkMode } = useTheme();
  return (
    <Container {...props} isAbsolute={isAbsolute}>
      <Content
        as={ButtonPressAnimation}
        isAbsolute={isAbsolute}
        onPress={onPress}
        opacityTouchable
      >
        <CircleOutline />
        <OpacityToggler friction={20} isVisible={!toggle} tension={1000}>
          <CheckmarkBackground isDarkMode={isDarkMode}>
            <Icon color="white" name="checkmark" />
          </CheckmarkBackground>
        </OpacityToggler>
      </Content>
    </Container>
  );
};

export default magicMemo(CoinCheckButton, 'toggle');
