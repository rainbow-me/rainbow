import { Dimensions } from 'react-native';

const ACTIONS = {};

const CONTAINER_HEIGHT = Math.ceil(Dimensions.get('screen').height) + 1;

const DEFAULT_ANIMATION_DURATION = 250;
const DEFAULT_BACKDROP_COLOR = 'black';
const DEFAULT_BACKDROP_OPACITY = 0.5;
const DEFAULT_HEIGHT = '100%';

export {
  ACTIONS,
  CONTAINER_HEIGHT,
  DEFAULT_ANIMATION_DURATION,
  DEFAULT_BACKDROP_COLOR,
  DEFAULT_BACKDROP_OPACITY,
  DEFAULT_HEIGHT,
};
