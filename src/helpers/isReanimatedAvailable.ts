// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native"' has no exported member 'Tu... Remove this comment to see the full error message
import { TurboModuleRegistry } from 'react-native';

export default !(
  !TurboModuleRegistry.get('NativeReanimated') &&
  // @ts-expect-error ts-migrate(7017) FIXME: Element implicitly has an 'any' type because type ... Remove this comment to see the full error message
  (!global.__reanimatedModuleProxy || global.__reanimatedModuleProxy.__shimmed)
);
