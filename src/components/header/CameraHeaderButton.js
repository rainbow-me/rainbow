import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForPropTypes, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { borders, colors } from '../../styles';
import Icon from '../icons/Icon';
import { Centered } from '../layout';
import HeaderButton from './HeaderButton';

const Container = styled(Centered)`
  ${borders.buildCircle(34)}
  background-color: ${colors.paleBlue};
`;

const CameraHeaderButton = ({ onPress }) => (
  <HeaderButton onPress={onPress} transformOrigin="right">
    <Container>
      <Icon
        color={colors.white}
        name="camera"
        style={{ marginBottom: 2, maxWidth: 19 }}
      />
    </Container>
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
