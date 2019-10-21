import { BlurView } from '@react-native-community/blur';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import ActivityIndicator from '../ActivityIndicator';
import { Centered } from '../layout';
import { Text } from '../text';
import TouchableBackdrop from '../TouchableBackdrop';

const Overlay = styled(Centered)`
  ${padding(19, 19, 22)}
  background-color: ${colors.alpha(colors.blueGreyDark, 0.15)};
  border-radius: 20;
`;

const Title = styled(Text).attrs({
  color: 'blueGreyDark',
  lineHeight: 'none',
  size: 'large',
  weight: 'semibold',
})`
  margin-left: 8;
`;

const LoadingOverlay = ({ title }) => (
  <Centered
    activeOpacity={1}
    component={TouchableBackdrop}
    disabled
    zIndex={999}
  >
    <Overlay blurAmount={20} blurType="light" component={BlurView}>
      <ActivityIndicator />
      {title && <Title>{title}</Title>}
    </Overlay>
  </Centered>
);

LoadingOverlay.propTypes = {
  title: PropTypes.string,
};

export default React.memo(LoadingOverlay);
