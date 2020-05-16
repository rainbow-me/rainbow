import { BlurView } from '@react-native-community/blur';
import PropTypes from 'prop-types';
import React from 'react';
import { Platform } from 'react-native';
import styled from 'styled-components/primitives';
import { colors, padding, position } from '../../styles';
import ActivityIndicator from '../ActivityIndicator';
import TouchableBackdrop from '../TouchableBackdrop';
import { Centered, Column } from '../layout';
import { Text } from '../text';

const Container = styled.View`
  ${Platform.OS === 'android'
    ? `
      align-self: center;
      flex: 1;
    `
    : ''}
  ${position.size('100%')};
  z-index: 999;
`;

const Overlay = styled(Centered)`
  ${padding(19, 19, 22)};
  background-color: ${colors.alpha(colors.blueGreyDark, 0.15)};
  border-radius: ${20};
  overflow: hidden;
`;

const OverlayBlur = styled(BlurView).attrs({
  blurAmount: 20,
  blurType: 'light',
})`
  ${position.cover};
  z-index: 1;
`;

const Title = styled(Text).attrs({
  color: colors.blueGreyDark,
  lineHeight: 'none',
  size: 'large',
  weight: 'semibold',
})`
  margin-left: 8;
`;

const LoadingOverlay = ({ title, ...props }) => (
  <Container
    {...props}
    as={Platform.OS === 'android' ? Column : TouchableBackdrop}
    disabled
  >
    <Overlay>
      <Centered zIndex={2}>
        <ActivityIndicator />
        {title && <Title>{title}</Title>}
      </Centered>
      <OverlayBlur />
    </Overlay>
  </Container>
);

LoadingOverlay.propTypes = {
  title: PropTypes.string,
};

const neverRerender = () => true;
export default React.memo(LoadingOverlay, neverRerender);
