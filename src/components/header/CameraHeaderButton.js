import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForPropTypes, withHandlers } from 'recompact';
import { borders, colors, position } from '../../styles';
import Icon from '../icons/Icon';
import { Centered } from '../layout';
import { ShadowStack } from '../shadow-stack';
import HeaderButton from './HeaderButton';

const CameraHeaderButton = ({ onPress }) => (
  <HeaderButton
    onPress={onPress}
    shouldRasterizeIOS
    transformOrigin="right"
    testID="goToCamera"
  >
    <ShadowStack
      {...borders.buildCircleAsObject(34)}
      backgroundColor={colors.paleBlue}
      shadows={[
        [0, 3, 5, colors.dark, 0.2],
        [0, 6, 10, colors.dark, 0.14],
      ]}
    >
      <Centered css={position.cover}>
        <Icon
          color={colors.white}
          name="camera"
          style={{ marginBottom: 1, maxWidth: 18 }}
        />
      </Centered>
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
