import React from 'react';
import styled from 'styled-components/primitives';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation, OpacityToggler } from '../animations';
import { CoinIconSize } from '../coin-icon';
import { Icon } from '../icons';
import { Row } from '../layout';
import { borders, colors, padding, position, shadow } from '@rainbow-me/styles';

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
  border-color: ${colors.alpha(colors.blueGreyDark, 0.12)};
  border-width: 1.5;
  position: absolute;
`;

const CheckmarkBackground = styled.View`
  ${borders.buildCircle(22)}
  ${padding(4.5)}
  ${shadow.build(0, 4, 12, colors.appleBlue, 0.4)}
  background-color: ${colors.appleBlue};
`;

const CoinCheckButton = ({ isAbsolute, onPress, toggle, ...props }) => (
  <Container {...props} isAbsolute={isAbsolute}>
    <Content
      as={ButtonPressAnimation}
      isAbsolute={isAbsolute}
      onPress={onPress}
      opacityTouchable
    >
      <CircleOutline />
      <OpacityToggler friction={20} isVisible={!toggle} tension={1000}>
        <CheckmarkBackground>
          <Icon color="white" name="checkmark" />
        </CheckmarkBackground>
      </OpacityToggler>
    </Content>
  </Container>
);

export default magicMemo(CoinCheckButton, 'toggle');
