import { BlurView } from '@react-native-community/blur';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, padding, position } from '../../../styles';
import ActivityIndicator from '../../ActivityIndicator';
import { Centered } from '../../layout';
import { Text } from '../../text';
import { View } from 'react-native';

const Overlay = styled(Centered)`
  ${padding(19, 19, 22)};
  background-color: ${colors.alpha(colors.blueGreyDark, 0.15)};
  border-radius: 20;
  overflow: hidden;
  align-items: center;
  justify-content: center;
`;

const Title = styled(Text).attrs({
  color: 'blueGreyDark',
  size: 'large',
  weight: 'semibold',
})`
  margin-left: 8;
`;

const LoadingOverlay = ({ title, ...props }) => (
  <View
    {...props}
    {...position.sizeAsObject('100%')}
    zIndex={999}
    style={{
      alignSelf: 'center',
      flex: 1,
    }}
  >
    <Overlay>
      <Centered zIndex={2}>
        <ActivityIndicator />
        {title && <Title>{title}</Title>}
      </Centered>
      <BlurView
        {...position.coverAsObject}
        blurAmount={20}
        blurType="light"
        zIndex={1}
      />
    </Overlay>
  </View>
);

LoadingOverlay.propTypes = {
  title: PropTypes.string,
};

const neverRerender = () => true;
export default React.memo(LoadingOverlay, neverRerender);
