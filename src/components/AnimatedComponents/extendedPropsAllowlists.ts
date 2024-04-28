import Animated from 'react-native-reanimated';

/**
 * These lists extend the built-in props allowlists for Animated components.
 *
 * The default list for the latest version of Reanimated can be found here:
 * https://github.com/software-mansion/react-native-reanimated/blob/main/src/propsAllowlists.ts
 */

/**
 * 🟡 Extended Native props allowlist 🟡
 */
Animated.addWhitelistedNativeProps({
  defaultValue: true, // AnimatedTextInput
  text: true, // AnimatedTextInput
});

/**
 * 🔵 Extended UI props allowlist 🔵
 */
Animated.addWhitelistedUIProps({
  source: true, // AnimatedFasterImage
});
