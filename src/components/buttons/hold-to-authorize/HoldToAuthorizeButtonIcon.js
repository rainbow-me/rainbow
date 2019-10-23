import PropTypes from 'prop-types';
import React from 'react';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { position } from '../../../styles';
import { interpolate, ScaleInAnimation } from '../../animations';
import { BiometryIcon, Icon } from '../../icons';
import { Centered } from '../../layout';

const { cond, divide, greaterThan } = Animated;

const BiometryIconSize = 31;
const IconContainer = styled(Centered)`
  ${position.size(BiometryIconSize)};
  left: 19;
  margin-bottom: 2;
  position: absolute;
`;

const HoldToAuthorizeButtonIcon = ({ animatedValue }) => (
  <IconContainer>
    <ScaleInAnimation value={animatedValue}>
      <BiometryIcon size={BiometryIconSize} />
    </ScaleInAnimation>
    <ScaleInAnimation
      scaleTo={0.001}
      value={cond(
        greaterThan(animatedValue, 0),
        interpolate(animatedValue, {
          extrapolate: Animated.Extrapolate.CLAMP,
          inputRange: [30, 100],
          outputRange: [5, 0],
        }),
        divide(1, animatedValue)
      )}
    >
      <Icon name="progress" progress={animatedValue} />
    </ScaleInAnimation>
  </IconContainer>
);

HoldToAuthorizeButtonIcon.propTypes = {
  animatedValue: PropTypes.object,
};

export default React.memo(HoldToAuthorizeButtonIcon);
