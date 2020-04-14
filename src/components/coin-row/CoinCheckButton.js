import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { ButtonPressAnimation, OpacityToggler } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Icon } from '../icons';

const CoinRowPaddingTop = 9;
const CoinRowPaddingBottom = 10;

const Centered = styled.View`
  align-items: center;
  height: 100%;
  justify-content: center;
  width: 100%;
`;

const CircleOutline = styled.View`
  border-color: ${colors.alpha(colors.blueGreyDark, 0.12)};
  border-radius: 11;
  border-width: 1.5;
  height: 22;
  position: absolute;
  width: 22;
`;

const CheckmarkBackground = styled.View`
  background-color: ${colors.appleBlue};
  border-radius: 11;
  height: 22;
  padding-top: 4.5;
  padding-left: 4.5;
  padding-right: 4.5;
  padding-bottom: 4.5;
  shadow-color: ${colors.appleBlue};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.4;
  shadow-radius: 6;
  width: 22;
`;

const CoinCheckButton = ({ isAbsolute, onPress, toggle }) => (
  <View
    style={{
      height: CoinIcon.size + CoinRowPaddingTop + CoinRowPaddingBottom,
      position: isAbsolute ? 'absolute' : 'relative',
      width: 60,
    }}
  >
    <ButtonPressAnimation onPress={onPress}>
      <Centered>
        <CircleOutline />
        <OpacityToggler friction={20} isVisible={!toggle} tension={1000}>
          <CheckmarkBackground>
            <Icon name="checkmark" color="white" />
          </CheckmarkBackground>
        </OpacityToggler>
      </Centered>
    </ButtonPressAnimation>
  </View>
);

CoinCheckButton.propTypes = {
  isAbsolute: PropTypes.bool,
  onPress: PropTypes.func,
  toggle: PropTypes.bool,
};

CoinCheckButton.defaultProps = {
  isAbsolute: false,
  toggle: false,
};

export default React.memo(CoinCheckButton);
