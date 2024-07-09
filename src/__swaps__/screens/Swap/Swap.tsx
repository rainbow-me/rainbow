import React, { useCallback, useEffect, useMemo } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';

import { Page } from '@/components/layout';
import { navbarHeight } from '@/components/navbar/Navbar';
import { Box } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { safeAreaInsetValues } from '@/utils';

import { ExchangeRateBubble } from '@/__swaps__/screens/Swap/components/ExchangeRateBubble';
import { FlipButton } from '@/__swaps__/screens/Swap/components/FlipButton';
import { SliderAndKeyboard } from '@/__swaps__/screens/Swap/components/SliderAndKeyboard';
import { SwapBackground } from '@/__swaps__/screens/Swap/components/SwapBackground';
import { SwapBottomPanel } from '@/__swaps__/screens/Swap/components/SwapBottomPanel';
import { SwapInputAsset } from '@/__swaps__/screens/Swap/components/SwapInputAsset';
import { SwapNavbar } from '@/__swaps__/screens/Swap/components/SwapNavbar';
import { SwapOutputAsset } from '@/__swaps__/screens/Swap/components/SwapOutputAsset';
import { SwapSheetGestureBlocker } from '@/__swaps__/screens/Swap/components/SwapSheetGestureBlocker';
import { ChainId } from '@/__swaps__/types/chains';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { useDelayedMount } from '@/hooks/useDelayedMount';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { SwapWarning } from './components/SwapWarning';
import { clearCustomGasSettings } from './hooks/useCustomGas';
import { SwapProvider, useSwapContext } from './providers/swap-provider';

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
    <SwapProvider>
      <MountAndUnmountHandlers />
      <SwapSheetGestureBlocker>
        <Box as={Page} style={styles.rootViewBackground} testID="swap-screen" width="full">
          <SwapBackground />
          <Box alignItems="center" height="full" paddingTop={{ custom: safeAreaInsetValues.top + (navbarHeight - 12) + 29 }} width="full">
            <SwapInputAsset />
            <FlipButton />
            <SwapOutputAsset />
            <SliderAndKeyboardAndBottomControls />
            <ExchangeRateBubbleAndWarning />
          </Box>
          <SwapNavbar />
        </Box>
      </SwapSheetGestureBlocker>
      <WalletAddressObserver />
    </SwapProvider>
  );
}

const MountAndUnmountHandlers = () => {
  useMountSignal();
  useCleanupOnUnmount();

  return null;
};

const useMountSignal = () => {
  useEffect(() => {
    useSwapsStore.setState({ isSwapsOpen: true });
  }, []);
};

const useCleanupOnUnmount = () => {
  useEffect(() => {
    return () => {
      const highestValueAsset = userAssetsStore.getState().getHighestValueAsset();
      const parsedAsset = highestValueAsset
        ? parseSearchAsset({
            assetWithPrice: undefined,
            searchAsset: highestValueAsset,
            userAsset: highestValueAsset,
          })
        : null;

      useSwapsStore.setState({
        inputAsset: parsedAsset,
        isSwapsOpen: false,
        outputAsset: null,
        outputSearchQuery: '',
        quote: null,
        selectedOutputChainId: parsedAsset?.chainId ?? ChainId.mainnet,
      });

      userAssetsStore.setState({ filter: 'all', inputSearchQuery: '' });

      clearCustomGasSettings();
    };
  }, []);
};

const WalletAddressObserver = () => {
  const currentWalletAddress = userAssetsStore(state => state.associatedWalletAddress);
  const { setAsset } = useSwapContext();

  const setNewInputAsset = useCallback(() => {
    const newHighestValueAsset = userAssetsStore.getState().getHighestValueAsset();

    if (userAssetsStore.getState().filter !== 'all') {
      userAssetsStore.setState({ filter: 'all' });
    }

    setAsset({
      type: SwapAssetType.inputAsset,
      asset: newHighestValueAsset,
    });

    if (userAssetsStore.getState().userAssets.size === 0) {
      setAsset({
        type: SwapAssetType.outputAsset,
        asset: null,
      });
    }
  }, [setAsset]);

  useAnimatedReaction(
    () => currentWalletAddress,
    (current, previous) => {
      const didWalletAddressChange = previous && current !== previous;

      if (didWalletAddressChange) {
        runOnJS(setNewInputAsset)();
      }
    }
  );

  return null;
};

const areBothAssetsPrefilled = () => {
  const { inputAsset, outputAsset } = useSwapsStore.getState();
  return !!inputAsset && !!outputAsset;
};

const SliderAndKeyboardAndBottomControls = () => {
  const skipDelayedMount = useMemo(() => areBothAssetsPrefilled(), []);
  const shouldMount = useDelayedMount({ skipDelayedMount });

  const { AnimatedSwapStyles } = useSwapContext();

  return shouldMount ? (
    <Box as={Animated.View} width="full" position="absolute" bottom="0px" style={AnimatedSwapStyles.hideWhenInputsExpanded}>
      <SliderAndKeyboard />
      <SwapBottomPanel />
    </Box>
  ) : null;
};

const ExchangeRateBubbleAndWarning = () => {
  const { AnimatedSwapStyles } = useSwapContext();
  return (
    <Box
      as={Animated.View}
      alignItems="center"
      justifyContent="center"
      style={[styles.swapWarningAndExchangeWrapper, AnimatedSwapStyles.hideWhileReviewingOrConfiguringGas]}
    >
      <ExchangeRateBubble />
      <SwapWarning />
    </Box>
  );
};

export const styles = StyleSheet.create({
  rootViewBackground: {
    borderRadius: IS_ANDROID ? 20 : ScreenCornerRadius,
    flex: 1,
    overflow: 'hidden',
    marginTop: StatusBar.currentHeight ?? 0,
  },
  swapWarningAndExchangeWrapper: {
    position: 'relative',
  },
});
