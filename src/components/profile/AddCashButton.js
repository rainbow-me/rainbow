import PropTypes from 'prop-types';
import React from 'react';
import { Image, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import RadialGradient from 'react-native-radial-gradient';
import { onlyUpdateForKeys, withProps } from 'recompact';
import AddCashButtonBackgroundSource from '../../assets/addCashButtonBackground.png';
import AddCashIconSource from '../../assets/addCashIcon.png';
import { margin } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Row, RowWithMargins } from '../layout';
import { Text } from '../text';

const AddCashLabel = withProps({
  align: 'center',
  color: 'white',
  family: 'SFProRounded',
  letterSpacing: 'looser',
  size: 'larger',
  weight: 'bold',
})(Text);

const enhance = onlyUpdateForKeys(['children', 'color']);

const AddCashButton = enhance(({ children, onPress }) => (
  <ButtonPressAnimation onPress={onPress} scaleTo={0.9} zIndex={-1}>
    <Row flex={0} css={margin(15, 15, 30)}>
      <View
        style={{
          alignItems: 'center',
          bottom: 0,
          justifyContent: 'center',
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        }}
      >
        <Image
          opacity={0.8}
          position="absolute"
          resizeMode="contain"
          source={AddCashButtonBackgroundSource}
          style={{ height: 154, width: 255 }}
          top={-40}
        />
      </View>
      <RadialGradient
        borderRadius={28}
        center={[155, 28]}
        colors={['#FF6B14', '#FFAC54', '#38BBFF']}
        overflow="hidden"
        padding={2}
        radius={155}
        style={{ height: 56, minWidth: 155 }}
        stops={[0, 0.635483871, 1]}
      >
        <RadialGradient
          borderRadius={26}
          center={[155, 26]}
          colors={['#FFB114', '#FF54BB', '#00F0FF']}
          overflow="hidden"
          radius={155}
          style={{ height: '100%', width: '100%' }}
          stops={[0, 0.635483871, 1]}
        >
          <RowWithMargins
            align="center"
            height="100%"
            justify="center"
            margin={-2}
            marginRight={9}
            blur={10}
            paddingBottom={4}
            zIndex={1}
          >
            <FastImage
              resizeMode={FastImage.resizeMode.contain}
              source={AddCashIconSource}
              style={{
                height: 45,
                marginTop: 7,
                width: 45,
              }}
            />
            <AddCashLabel>{children}</AddCashLabel>
          </RowWithMargins>
        </RadialGradient>
      </RadialGradient>
    </Row>
  </ButtonPressAnimation>
));

AddCashButton.propTypes = {
  children: PropTypes.node,
  onPress: PropTypes.func,
};

AddCashButton.defaultProps = {
  borderRadius: 28,
};

export default AddCashButton;
