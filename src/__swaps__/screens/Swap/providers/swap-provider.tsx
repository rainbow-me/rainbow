// @refresh
import React, { createContext, useContext, ReactNode } from 'react';
import { StyleProp, TextStyle, TextInput } from 'react-native';
import {
  AnimatedRef,
  SharedValue,
  runOnJS,
  runOnUI,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { SwapAssetType, inputKeys } from '@/__swaps__/types/swap';
import { INITIAL_SLIDER_POSITION, SLIDER_COLLAPSED_HEIGHT, SLIDER_HEIGHT, SLIDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { useAnimatedSwapStyles } from '@/__swaps__/screens/Swap/hooks/useAnimatedSwapStyles';
import { useSwapTextStyles } from '@/__swaps__/screens/Swap/hooks/useSwapTextStyles';
import { useSwapNavigation, NavigationSteps } from '@/__swaps__/screens/Swap/hooks/useSwapNavigation';
import { useSwapInputsController } from '@/__swaps__/screens/Swap/hooks/useSwapInputsController';
import { ExtendedAnimatedAssetWithColors, ParsedSearchAsset } from '@/__swaps__/types/assets';
import { useSwapWarning } from '@/__swaps__/screens/Swap/hooks/useSwapWarning';
import { CrosschainQuote, Quote, QuoteError, SwapType, getCrosschainQuote, getQuote } from '@rainbow-me/swaps';
import { swapsStore } from '@/state/swaps/swapsStore';
import { isSameAsset } from '@/__swaps__/utils/assets';
import { buildQuoteParams, parseAssetAndExtend } from '@/__swaps__/utils/swaps';
import { ChainId } from '@/__swaps__/types/chains';
import { logger } from '@/logger';

interface SwapContextType {
  isFetching: SharedValue<boolean>;
  searchInputRef: AnimatedRef<TextInput>;

  // TODO: Combine navigation progress steps into a single shared value
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
  reviewProgress: SharedValue<number>;

  sliderXPosition: SharedValue<number>;
  sliderPressProgress: SharedValue<number>;

  focusedInput: SharedValue<inputKeys>;

  // TODO: Separate this into Zustand
  outputChainId: SharedValue<ChainId>;

  internalSelectedInputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  internalSelectedOutputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  setAsset: ({ type, asset }: { type: SwapAssetType; asset: ParsedSearchAsset }) => void;

  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
  fetchQuote: () => Promise<void>;

  SwapInputController: ReturnType<typeof useSwapInputsController>;
  AnimatedSwapStyles: ReturnType<typeof useAnimatedSwapStyles>;
  SwapTextStyles: ReturnType<typeof useSwapTextStyles>;
  SwapNavigation: ReturnType<typeof useSwapNavigation>;
  SwapWarning: ReturnType<typeof useSwapWarning>;

  confirmButtonIcon: Readonly<SharedValue<string>>;
  confirmButtonLabel: Readonly<SharedValue<string>>;
  confirmButtonIconStyle: StyleProp<TextStyle>;
}

const SwapContext = createContext<SwapContextType | undefined>(undefined);

interface SwapProviderProps {
  children: ReactNode;
}

export const SwapProvider = ({ children }: SwapProviderProps) => {
  const isFetching = useSharedValue(false);

  const searchInputRef = useAnimatedRef<TextInput>();

  const inputProgress = useSharedValue(NavigationSteps.INPUT_ELEMENT_FOCUSED);
  const outputProgress = useSharedValue(NavigationSteps.INPUT_ELEMENT_FOCUSED);
  const reviewProgress = useSharedValue(NavigationSteps.INPUT_ELEMENT_FOCUSED);

  const sliderXPosition = useSharedValue(SLIDER_WIDTH * INITIAL_SLIDER_POSITION);
  const sliderPressProgress = useSharedValue(SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT);

  const focusedInput = useSharedValue<inputKeys>('inputAmount');
  const outputChainId = useSharedValue<ChainId>(ChainId.mainnet);

  const internalSelectedInputAsset = useSharedValue<ExtendedAnimatedAssetWithColors | null>(null);
  const internalSelectedOutputAsset = useSharedValue<ExtendedAnimatedAssetWithColors | null>(null);

  const quote = useSharedValue<Quote | CrosschainQuote | QuoteError | null>(null);

  const fetchQuote = async () => {
    'worklet';

    const params = buildQuoteParams({
      inputAmount: SwapInputController.inputValues.value.inputAmount,
      outputAmount: SwapInputController.inputValues.value.outputAmount,
      focusedInput: focusedInput.value,
    });

    if (!params) return;

    const response = (params.swapType === SwapType.crossChain ? await getCrosschainQuote(params) : await getQuote(params)) as
      | Quote
      | CrosschainQuote
      | QuoteError;

    setQuote({ data: response });

    // TODO: Handle setting quote interval AND asset price fetching
  };

  const setQuote = ({ data }: { data: Quote | CrosschainQuote | QuoteError | null }) => {
    'worklet';
    quote.value = data;
    runOnJS(swapsStore.setState)({ quote: data });
  };

  const handleProgressNavigation = ({
    type,
    inputAsset,
    outputAsset,
  }: {
    type: SwapAssetType;
    inputAsset: ParsedSearchAsset | null;
    outputAsset: ParsedSearchAsset | null;
  }) => {
    switch (type) {
      case SwapAssetType.inputAsset:
        if (outputAsset) {
          inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
          outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
        } else {
          inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
          outputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
        }
        break;
      case SwapAssetType.outputAsset:
        if (inputAsset) {
          inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
          outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
        } else {
          inputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
          outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
        }
        break;
    }
  };

  const setAsset = ({ type, asset }: { type: SwapAssetType; asset: ParsedSearchAsset }) => {
    const updateAssetValue = ({ type, asset }: { type: SwapAssetType; asset: ParsedSearchAsset | null }) => {
      'worklet';

      switch (type) {
        case SwapAssetType.inputAsset:
          // TODO: Pre-process a bunch of stuff here...
          /**
           * Colors, price, etc.
           */
          internalSelectedInputAsset.value = parseAssetAndExtend({ asset });
          break;
        case SwapAssetType.outputAsset:
          // TODO: Pre-process a bunch of stuff here...
          /**
           * Colors, price, etc.
           */
          internalSelectedOutputAsset.value = parseAssetAndExtend({ asset });
          break;
      }
    };

    // const prevAsset = swapsStore.getState()[type];
    const prevOtherAsset = swapsStore.getState()[type === SwapAssetType.inputAsset ? SwapAssetType.outputAsset : SwapAssetType.inputAsset];

    // TODO: Fix me. This is causing assets to not be set sometimes?
    // if we're setting the same asset, exit early as it's a no-op
    // if (prevAsset && isSameAsset(prevAsset, asset)) {
    //   logger.debug(`[setAsset]: Not setting ${type} asset as it's the same as what is already set`);
    //   handleProgressNavigation({
    //     type,
    //     inputAsset: type === SwapAssetType.inputAsset ? asset : prevOtherAsset,
    //     outputAsset: type === SwapAssetType.outputAsset ? asset : prevOtherAsset,
    //   });
    //   return;
    // }

    // if we're setting the same asset as the other asset, we need to clear the other asset
    if (prevOtherAsset && isSameAsset(prevOtherAsset, asset)) {
      logger.debug(`[setAsset]: Swapping ${type} asset for ${type === SwapAssetType.inputAsset ? 'output' : 'input'} asset`);

      swapsStore.setState({
        [type === SwapAssetType.inputAsset ? SwapAssetType.outputAsset : SwapAssetType.inputAsset]: null,
      });
      runOnUI(updateAssetValue)({
        type: type === SwapAssetType.inputAsset ? SwapAssetType.outputAsset : SwapAssetType.inputAsset,
        asset: null,
      });
    }

    logger.debug(`[setAsset]: Setting ${type} asset to ${asset.name} on ${asset.chainId}`);

    // TODO: Bunch of logic left to implement here... reset prices, retrigger quote fetching, etc.
    swapsStore.setState({
      [type]: asset,
    });
    runOnJS(updateAssetValue)({ type, asset });
    handleProgressNavigation({
      type,
      inputAsset: type === SwapAssetType.inputAsset ? asset : prevOtherAsset,
      outputAsset: type === SwapAssetType.outputAsset ? asset : prevOtherAsset,
    });
  };

  const SwapNavigation = useSwapNavigation({
    inputProgress,
    outputProgress,
    reviewProgress,
  });

  const SwapInputController = useSwapInputsController({
    ...SwapNavigation,
    focusedInput,
    isFetching,
    sliderXPosition,
    inputProgress,
    outputProgress,
  });

  const SwapWarning = useSwapWarning({
    SwapInputController,
    sliderXPosition,
    isFetching,
  });

  const AnimatedSwapStyles = useAnimatedSwapStyles({
    SwapInputController,
    SwapWarning,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    inputProgress,
    outputProgress,
    reviewProgress,
    isFetching,
  });
  const SwapTextStyles = useSwapTextStyles({
    ...SwapInputController,
    focusedInput,
    inputProgress,
    outputProgress,
    sliderPressProgress,
  });

  const confirmButtonIcon = useDerivedValue(() => {
    const isReviewing = reviewProgress.value === NavigationSteps.SHOW_REVIEW;
    if (isReviewing) {
      return '􀎽';
    }

    const isInputZero = Number(SwapInputController.inputValues.value.inputAmount) === 0;
    const isOutputZero = Number(SwapInputController.inputValues.value.outputAmount) === 0;

    if (SwapInputController.inputMethod.value !== 'slider' && (isInputZero || isOutputZero) && !isFetching.value) {
      return '';
    } else if (SwapInputController.inputMethod.value === 'slider' && SwapInputController.percentageToSwap.value === 0) {
      return '';
    } else {
      return '􀕹';
    }
  });

  const confirmButtonLabel = useDerivedValue(() => {
    const isReviewing = reviewProgress.value === NavigationSteps.SHOW_REVIEW;
    if (isReviewing) {
      return 'Hold to Swap';
    }

    const isInputZero = Number(SwapInputController.inputValues.value.inputAmount) === 0;
    const isOutputZero = Number(SwapInputController.inputValues.value.outputAmount) === 0;

    if (SwapInputController.inputMethod.value !== 'slider' && (isInputZero || isOutputZero) && !isFetching.value) {
      return 'Enter Amount';
    } else if (SwapInputController.inputMethod.value === 'slider' && SwapInputController.percentageToSwap.value === 0) {
      return 'Enter Amount';
    } else {
      return 'Review';
    }
  });

  const confirmButtonIconStyle = useAnimatedStyle(() => {
    const isInputZero = Number(SwapInputController.inputValues.value.inputAmount) === 0;
    const isOutputZero = Number(SwapInputController.inputValues.value.outputAmount) === 0;

    const sliderCondition = SwapInputController.inputMethod.value === 'slider' && SwapInputController.percentageToSwap.value === 0;
    const inputCondition = SwapInputController.inputMethod.value !== 'slider' && (isInputZero || isOutputZero) && !isFetching.value;

    const shouldHide = sliderCondition || inputCondition;

    return {
      display: shouldHide ? 'none' : 'flex',
    };
  });

  console.log('re-rendered swap provider');

  return (
    <SwapContext.Provider
      value={{
        isFetching,
        searchInputRef,

        inputProgress,
        outputProgress,
        reviewProgress,

        sliderXPosition,
        sliderPressProgress,

        focusedInput,
        outputChainId,

        internalSelectedInputAsset,
        internalSelectedOutputAsset,
        setAsset,

        quote,
        fetchQuote,

        SwapInputController,
        AnimatedSwapStyles,
        SwapTextStyles,
        SwapNavigation,
        SwapWarning,

        confirmButtonIcon,
        confirmButtonLabel,
        confirmButtonIconStyle,
      }}
    >
      {children}
    </SwapContext.Provider>
  );
};

export const useSwapContext = () => {
  const context = useContext(SwapContext);
  if (context === undefined) {
    throw new Error('useSwap must be used within a SwapProvider');
  }
  return context;
};

export { NavigationSteps };
