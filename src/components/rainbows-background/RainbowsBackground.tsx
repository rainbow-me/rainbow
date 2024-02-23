import React from 'react';
import { Dimensions } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import RainbowGreyNeon from '../../assets/rainbows/greyneon.png';
import RainbowLight from '../../assets/rainbows/light.png';
import RainbowLiquid from '../../assets/rainbows/liquid.png';
import RainbowNeon from '../../assets/rainbows/neon.png';
import RainbowPixel from '../../assets/rainbows/pixel.png';
import SingleRainbow from './SingleRainbow';

const { height: deviceHeight } = Dimensions.get('screen');

const rainbows = [
  {
    delay: 0,
    id: 'grey',
    rotate: 150,
    scale: 0.5066666667,
    source: ios ? { uri: 'greyneon' } : RainbowGreyNeon,
    x: -116,
    y: -202,
  },
  {
    delay: 20,
    id: 'neon',
    rotate: 394.75,
    scale: 0.3333333333,
    source: ios ? { uri: 'neon' } : RainbowNeon,
    x: 149,
    y: deviceHeight < 725 ? 380 * (deviceHeight / 725) : 380,
  },
  {
    delay: 40,
    id: 'pixel',
    rotate: 360,
    scale: 0.6666666667,
    source: ios ? { uri: 'pixel' } : RainbowPixel,
    x: 173,
    y: deviceHeight < 800 ? -263 * (deviceHeight / 800) : -263,
  },
  {
    delay: 60,
    id: 'light',
    rotate: -33,
    scale: 0.2826666667,
    source: ios ? { uri: 'light' } : RainbowLight,
    x: -172,
    y: 180,
  },
  {
    delay: 80,
    id: 'liquid',
    rotate: 75,
    scale: deviceHeight < 800 ? 0.42248 * (deviceHeight / 800) : 0.42248,
    source: ios ? { uri: 'liquid' } : RainbowLiquid,
    x: 40,
    y: deviceHeight < 800 ? 215 * (deviceHeight / 800) : 215,
  },
];

interface Props {
  shouldAnimate: SharedValue<boolean>;
}

const RainbowsBackgroundComponent = ({ shouldAnimate }: Props) => (
  <>
    {rainbows.map(rainbow => (
      <SingleRainbow details={rainbow} key={rainbow.id} shouldAnimate={shouldAnimate} />
    ))}
  </>
);

export const RainbowsBackground = React.memo(RainbowsBackgroundComponent);
