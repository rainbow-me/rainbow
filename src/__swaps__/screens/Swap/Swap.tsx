import React, { useCallback, useEffect, useMemo } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';

import { Page } from '@/components/layout';
import { navbarHeight } from '@/components/navbar/Navbar';
import { DecoyScrollView } from '@/components/sheet/DecoyScrollView';
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
import { ChainId } from '@/state/backendNetworks/types';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { AbsolutePortalRoot } from '@/components/AbsolutePortal';
import { useAccountSettings } from '@/hooks';
import { useDelayedMount } from '@/hooks/useDelayedMount';
import { userAssetsStore } from '@/state/assets/userAssets';
import { swapsStore, useSwapsStore } from '@/state/swaps/swapsStore';
import { SwapWarning } from './components/SwapWarning';
import { clearCustomGasSettings } from './hooks/useCustomGas';
import { SwapProvider, useSwapContext } from './providers/swap-provider';
import { NavigateToSwapSettingsTrigger } from './components/NavigateToSwapSettingsTrigger';
import { useSwapsSearchStore } from './resources/search/searchV2';
import { ReviewButton } from './components/ReviewButton';

/** README
 * This screen is largely driven by Reanimated and Gesture Handler, which
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
      <DecoyScrollView />
      <AbsolutePortalRoot />
      <NavigateToSwapSettingsTrigger />
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
    useSwapsStore.setState(state => ({
      ...state,
      isSwapsOpen: true,
      selectedOutputChainId: state?.inputAsset?.chainId ?? state?.preferredNetwork ?? state?.selectedOutputChainId ?? ChainId.mainnet,
    }));
  }, []);
};

const useCleanupOnUnmount = () => {
  useEffect(() => {
    return () => {
      const highestValueEth = userAssetsStore.getState().getHighestValueNativeAsset();
      const preferredNetwork = swapsStore.getState().preferredNetwork;
      const parsedAsset = highestValueEth
        ? parseSearchAsset({
            assetWithPrice: undefined,
            searchAsset: highestValueEth,
            userAsset: highestValueEth,
          })
        : null;

      useSwapsStore.setState({
        inputAsset: parsedAsset,
        isSwapsOpen: false,
        outputAsset: null,
        quote: null,
        selectedOutputChainId: parsedAsset?.chainId ?? preferredNetwork ?? ChainId.mainnet,
        quickBuyAnalyticalData: undefined,
        lastNavigatedTrendingToken: undefined,
      });

      useSwapsSearchStore.setState({ searchQuery: '' });
      userAssetsStore.setState({ filter: 'all', inputSearchQuery: '' });

      clearCustomGasSettings();
    };
  }, []);
};

const WalletAddressObserver = () => {
  const { accountAddress } = useAccountSettings();
  const { setAsset } = useSwapContext();

  const setNewInputAsset = useCallback(() => {
    const newHighestValueEth = userAssetsStore.getState().getHighestValueNativeAsset();

    if (userAssetsStore.getState().filter !== 'all') {
      userAssetsStore.setState({ filter: 'all' });
    }

    setAsset({
      type: SwapAssetType.inputAsset,
      asset: newHighestValueEth,
    });

    if (userAssetsStore.getState().userAssets.size === 0) {
      setAsset({
        type: SwapAssetType.outputAsset,
        asset: null,
      });
    }
  }, [setAsset]);

  useAnimatedReaction(
    () => accountAddress,
    (current, previous) => {
      const didWalletAddressChange = previous && current !== previous;

      if (didWalletAddressChange) runOnJS(setNewInputAsset)();
    },
    []
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
  const isDegenModeEnabled = useSwapsStore(s => s.degenMode);

  return (
    <Box
      as={Animated.View}
      alignItems="center"
      justifyContent="center"
      paddingVertical={'20px'}
      paddingHorizontal={'24px'}
      style={[styles.swapWarningAndExchangeWrapper, AnimatedSwapStyles.hideWhileReviewingOrConfiguringGas]}
    >
      <Box flexDirection="row" justifyContent="space-between" width="full">
        <Box as={Animated.View} style={AnimatedSwapStyles.removeWhenNoPriceImpact}>
          <SwapWarning />
        </Box>
        <Box as={Animated.View} style={AnimatedSwapStyles.removeWhenPriceImpact}>
          <ExchangeRateBubble />
        </Box>
        {isDegenModeEnabled && <ReviewButton />}
      </Box>
    </Box>
  );
};

export const styles = StyleSheet.create({
  rootViewBackground: {
    borderTopLeftRadius: IS_ANDROID ? 20 : ScreenCornerRadius,
    borderTopRightRadius: IS_ANDROID ? 20 : ScreenCornerRadius,
    borderBottomLeftRadius: IS_ANDROID ? 0 : ScreenCornerRadius,
    borderBottomRightRadius: IS_ANDROID ? 0 : ScreenCornerRadius,
    flex: 1,
    overflow: 'hidden',
    marginTop: StatusBar.currentHeight ?? 0,
  },
  swapWarningAndExchangeWrapper: {
    position: 'relative',
  },
});
