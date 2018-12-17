import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForPropTypes, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { borders, colors, position, shadow } from '../../styles';
import Icon from '../icons/Icon';
import { Centered } from '../layout';
import { ShadowStack } from '../shadow-stack';
import HeaderButton from './HeaderButton';

const Container = styled(Centered)`
  ${borders.buildCircle(34)}
  ${position.cover}
  background-color: ${colors.paleBlue};
`;

const CameraHeaderButton = ({ onPress }) => (
  <HeaderButton onPress={onPress} transformOrigin="right">
    <ShadowStack
      {...borders.buildCircleAsObject(34)}
      shadows={[
        shadow.buildString(0, 1.5, 2.5),
        shadow.buildString(0, 3, 5),
      ]}
    >
      <Container>
        <Icon
          color={colors.white}
          name="camera"
          style={{ marginBottom: 2, maxWidth: 19 }}
        />
      </Container>
    </ShadowStack>
  </HeaderButton>
);

CameraHeaderButton.propTypes = {
  onPress: PropTypes.func,
};

export default compose(
  withHandlers({
    onPress: ({ navigation }) => () => navigation.navigate('QRScannerScreen'),
  }),
  onlyUpdateForPropTypes,
)(CameraHeaderButton);
