import React from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';

import { IS_ANDROID } from '@/env';
import { Page } from '@/components/layout';
import { Box } from '@/design-system';

import { SheetGestureBlocker } from './components/SheetGestureBlocker';
import { SwapBackground } from './components/SwapBackground';
import { FlipButton } from './components/FlipButton';
import { ExchangeRateBubble } from './components/ExchangeRateBubble';
import { SwapInputAsset } from './components/controls/SwapInputAsset';
import { SwapOutputAsset } from './components/controls/SwapOutputAsset';
import { SwapNavbar } from './components/SwapNavbar';
import { SwapAmountInputs } from './components/controls/SwapAmountInputs';

/** README
 * This prototype is largely driven by Reanimated and Gesture Handler, which
 * allows the UI to respond instantly when the user types into one of the four
 * swap inputs or drags the slider (these together make up the inputMethods).
 *
 * We use Gesture Handler for buttons and elements (number pad keys, the slider),
 * that when pressed or interacted with, need to modify an Animated value. We do
 * this to bypass the JS thread when responding to user input, which avoids all
 * bridge-related bottlenecks and the resulting UI lag.
 *
 * We rely on Reanimated’s useAnimatedReaction to observe changes to any of the
 * input values (the inputValues), and then respond as needed depending on the
 * entered value and the inputMethod associated with the change.
 * (useAnimatedReaction is like a useEffect, but it runs on the UI thread and can
 * respond instantly to changes in Animated values.)
 *
 * We use worklets to update and format values on the UI thread in real time.
 * Only after a user has modified one of the inputValues or released the slider,
 * will the updated quote parameters be sent to the JS thread, where a new quote
 * is fetched and the response is sent back to the UI thread.
 *
 * Up until that point, all user input and associated UI updates are handled on
 * the UI thread, and values in the UI are updated via Animated shared values
 * that are passed to AnimatedText components (equivalent to the Text component,
 * but capable of directly rendering Animated shared values).
 *
 * The implication of this is that once the UI is initialized, even if the JS
 * thread is fully blocked, it won’t block user input, and it won’t block the UI.
 * The UI will remain responsive up until it needs the result of a quote from the
 * JS thread.
 *
 * This approach has the added benefit of eliminating tons of otherwise necessary
 * re-renders, which further increases the speed of the swap flow.
 *
 * tldr, ⚡️ it’s fast ⚡️
 */

export function SwapScreen() {
  return (
    <SheetGestureBlocker>
      <Box as={Page} style={styles.rootViewBackground} testID="swap-screen" width="full">
        <SwapBackground>
          <Box alignItems="center" height="full" paddingTop={{ custom: 29 }} width="full">
            <SwapInputAsset />
            <FlipButton />
            <SwapOutputAsset />
            <ExchangeRateBubble />
            <SwapAmountInputs />
          </Box>
        </SwapBackground>
        <SwapNavbar />
      </Box>
    </SheetGestureBlocker>
  );
}

export const styles = StyleSheet.create({
  rootViewBackground: {
    backgroundColor: 'transparent',
    borderRadius: IS_ANDROID ? 20 : ScreenCornerRadius,
    flex: 1,
    overflow: 'hidden',
    marginTop: StatusBar.currentHeight ?? 0,
  },
});
