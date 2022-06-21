import { sortList } from '../helpers/sortList';
import { reduceArrayToObject } from '../utils';

const DefaultConfig = {
  damping: 42,
  mass: 0.666, // 0.3, // 0.5 is dece too // 0.6, //
  overshootClamping: false,
  restDisplacementThreshold: 40, // 1, //40,
  restSpeedThreshold: 50, // 80,
  stiffness: 200,
  swipeVelocityImpact: 40,
};

let config = { ...DefaultConfig };

const getSpringConfig = () => config;

const setSpringConfig = changesToConfig => {
  const newConfig = {
    ...config,
    ...changesToConfig,
  };

  const alphabeticalConfigKeys = sortList(Object.keys(newConfig));
  const arrayOfConfigObjects = alphabeticalConfigKeys.map(key => ({
    [key]: newConfig[key],
  }));

  config = reduceArrayToObject(arrayOfConfigObjects);
};

export default {
  config,
  defaultConfig: DefaultConfig,
  get: getSpringConfig,
  set: setSpringConfig,
};
