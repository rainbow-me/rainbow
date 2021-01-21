import { TurboModuleRegistry } from 'react-native';

export default !(
  !TurboModuleRegistry.get('NativeReanimated') &&
  (!global.__reanimatedModuleProxy || global.__reanimatedModuleProxy.__shimmed)
);
