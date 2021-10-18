import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package '@rainbow-me/ultimate-list' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ default: '', ios: "- You have run 'pod install'\n" }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

const UltimateList = NativeModules.UltimateList
  ? NativeModules.UltimateList
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export function multiply(a: number, b: number): Promise<number> {
  return UltimateList.multiply(a, b);
}
