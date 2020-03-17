import MaskedView from '@react-native-community/masked-view';
import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import Animated from 'react-native-reanimated';
import { useDimensions } from '../../hooks';
import { Text } from '../text';

const sx = StyleSheet.create({
  gradient: {
    height: 108,
    width: '100%',
  },
  maskElement: {
    left: '-50%',
    width: '200%',
  },
});

const gradientColors = ['#FFB114', '#FF54BB', '#00F0FF', '#34F3FF'];
const gradientStops = [0.2049, 0.6354, 0.8318, 0.9541];
const NumpadValueGradient = () => {
  const { width } = useDimensions();

  const gradientXPoint = width - 48;
  const gradientPoints = [gradientXPoint, 53.5];

  return (
    <RadialGradient
      center={gradientPoints}
      colors={gradientColors}
      radius={gradientXPoint}
      stops={gradientStops}
      style={sx.gradient}
    />
  );
};

const NumpadValueText = props => {
  const { width } = useDimensions();
  return (
    <Text
      {...props}
      align="center"
      color="white"
      lineHeight={108}
      size={width * 0.24}
      weight="bold"
    />
  );
};

const NumpadValue = ({ scale, translateX, value, ...props }) => {
  const maskElement = (
    <Animated.View
      style={[sx.maskElement, { transform: [{ scale, translateX }] }]}
    >
      <NumpadValueText>{'$' + (value ? value : '0')}</NumpadValueText>
    </Animated.View>
  );

  return (
    <MaskedView maskElement={maskElement} width="100%" {...props}>
      <NumpadValueGradient />
    </MaskedView>
  );
};

NumpadValue.propTypes = {
  scale: PropTypes.object,
  translateX: PropTypes.object,
  value: PropTypes.string,
};

export default React.memo(NumpadValue);
