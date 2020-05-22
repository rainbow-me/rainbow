import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { borders, colors, padding, position, shadow } from '../../styles';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation, OpacityToggler } from '../animations';
import { CoinIconSize } from '../coin-icon';
import { Icon } from '../icons';
import { Centered } from '../layout';

const Container = styled.View`
  ${position.size(CoinIconSize)};
  position: ${({ isAbsolute }) => (isAbsolute ? 'absolute' : 'relative')};
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
  ${shadow.build(0, 4, 6, colors.appleBlue, 0.4)}
  background-color: ${colors.appleBlue};
`;

const CoinCheckButton = ({ isAbsolute, onPress, toggle, ...props }) => (
  <Container {...props} isAbsolute={isAbsolute}>
    <ButtonPressAnimation onPress={onPress}>
      <Centered {...position.sizeAsObject('100%')}>
        <CircleOutline />
        <OpacityToggler friction={20} isVisible={!toggle} tension={1000}>
          <CheckmarkBackground>
            <Icon name="checkmark" color="white" />
          </CheckmarkBackground>
        </OpacityToggler>
      </Centered>
    </ButtonPressAnimation>
  </Container>
);

CoinCheckButton.propTypes = {
  onPress: PropTypes.func,
  toggle: PropTypes.bool,
};

CoinCheckButton.defaultProps = {
  toggle: false,
};

export default magicMemo(CoinCheckButton, 'toggle');
