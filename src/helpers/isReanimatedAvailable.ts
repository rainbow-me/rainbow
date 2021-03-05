// @ts-ignore
import { TurboModuleRegistry } from 'react-native';

export default !(
  !TurboModuleRegistry.get('NativeReanimated') &&
  // @ts-ignore
  (!global.__reanimatedModuleProxy || global.__reanimatedModuleProxy.__shimmed)
);
