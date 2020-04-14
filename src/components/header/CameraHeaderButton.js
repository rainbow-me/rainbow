import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import ShadowStack from 'react-native-shadow-stack';
import { compose, withHandlers } from 'recompact';
import { borders, colors, position } from '../../styles';
import Icon from '../icons/Icon';
import { Centered } from '../layout';
import HeaderButton from './HeaderButton';
import { withCoinListEdited } from '../../hoc';
import { OpacityToggler } from '../animations';

const CameraHeaderButton = ({ onPress, isCoinListEdited }) => (
  <OpacityToggler
    endingOpacity={0.4}
    isVisible={isCoinListEdited}
    startingOpacity={1}
  >
    <View pointerEvents={isCoinListEdited ? 'none' : 'auto'}>
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
    </View>
  </OpacityToggler>
);

CameraHeaderButton.propTypes = {
  onPress: PropTypes.func,
};

export default compose(
  withHandlers({
    onPress: ({ navigation }) => () => navigation.navigate('QRScannerScreen'),
  }),
  withCoinListEdited
)(CameraHeaderButton);
