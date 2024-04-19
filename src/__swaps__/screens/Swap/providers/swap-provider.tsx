// @refresh
import React, { createContext, useContext, ReactNode } from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { inputKeys } from '@/__swaps__/types/swap';
import { INITIAL_SLIDER_POSITION, SLIDER_COLLAPSED_HEIGHT, SLIDER_HEIGHT, SLIDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { useAnimatedSwapStyles } from '@/__swaps__/screens/Swap/hooks/useAnimatedSwapStyles';
import { useSwapTextStyles } from '@/__swaps__/screens/Swap/hooks/useSwapTextStyles';
import { useSwapNavigation, NavigationSteps } from '@/__swaps__/screens/Swap/hooks/useSwapNavigation';
import { useSwapInputsController } from '@/__swaps__/screens/Swap/hooks/useSwapInputsController';
import { useSwapWarning } from '@/__swaps__/screens/Swap/hooks/useSwapWarning';

interface SwapContextType {
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
  configProgress: SharedValue<number>;
  sliderXPosition: SharedValue<number>;
  sliderPressProgress: SharedValue<number>;
  focusedInput: SharedValue<inputKeys>;
  isFetching: SharedValue<boolean>;
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
  const inputProgress = useSharedValue(NavigationSteps.INPUT_ELEMENT_FOCUSED);
  const outputProgress = useSharedValue(NavigationSteps.INPUT_ELEMENT_FOCUSED);
  const configProgress = useSharedValue(NavigationSteps.INPUT_ELEMENT_FOCUSED);
  const sliderXPosition = useSharedValue(SLIDER_WIDTH * INITIAL_SLIDER_POSITION);
  const sliderPressProgress = useSharedValue(SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT);
  const focusedInput = useSharedValue<inputKeys>('inputAmount');

  const SwapNavigation = useSwapNavigation({
    inputProgress,
    outputProgress,
    configProgress,
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
    inputProgress,
    outputProgress,
    configProgress,
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
    const isReviewing = configProgress.value === NavigationSteps.SHOW_REVIEW;
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
    const isReviewing = configProgress.value === NavigationSteps.SHOW_REVIEW;
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
        inputProgress,
        outputProgress,
        configProgress,
        sliderXPosition,
        sliderPressProgress,
        focusedInput,
        isFetching,
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
