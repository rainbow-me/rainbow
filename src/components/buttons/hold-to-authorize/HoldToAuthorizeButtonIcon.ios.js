import PropTypes from 'prop-types';
import React from 'react';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { interpolate, ScaleInAnimation } from '../../animations';
import { BiometryIcon, Icon } from '../../icons';
import { Centered } from '../../layout';
import { position } from '@rainbow-me/styles';

const { cond, divide, greaterThan } = Animated;

const Container = styled(Centered)`
  ${position.size(31)};
  left: 15;
  position: absolute;
`;

const HoldToAuthorizeButtonIcon = ({ animatedValue, biometryType }) => (
  <Container>
    <ScaleInAnimation alignItems="flex-start" value={animatedValue}>
      <BiometryIcon biometryType={biometryType} />
    </ScaleInAnimation>
    <ScaleInAnimation
      alignItems="center"
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
  </Container>
);

HoldToAuthorizeButtonIcon.propTypes = {
  animatedValue: PropTypes.object,
  biometryType: PropTypes.string,
};

const arePropsEqual = (prev, next) => prev.biometryType === next.biometryType;
export default React.memo(HoldToAuthorizeButtonIcon, arePropsEqual);
