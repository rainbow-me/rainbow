import React, { createContext, useContext, ReactNode, SetStateAction, Dispatch, useState } from 'react';
import { SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { inputKeys } from '../types/swap';
import { INITIAL_SLIDER_POSITION, SLIDER_COLLAPSED_HEIGHT, SLIDER_HEIGHT, SLIDER_WIDTH, ETH_COLOR_DARK, ETH_COLOR } from '../constants';
import { INPUT_ASSET_BALANCE, INPUT_ASSET_USD_PRICE, OUTPUT_ASSET_USD_PRICE, OUTPUT_COLOR } from '../dummyValues';
import { useColorMode } from '@/design-system';
import { useAnimatedSwapStyles } from '../hooks/useAnimatedSwapStyles';
import { useSwapTextStyles } from '../hooks/useSwapTextStyles';
import { useSwapNavigation } from '../hooks/useSwapNavigation';
import { useSwapInputsController } from '../hooks/useSwapInputsController';
import { StyleProp, TextStyle } from 'react-native';

interface SwapContextType {
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
  sliderXPosition: SharedValue<number>;
  sliderPressProgress: SharedValue<number>;
  focusedInput: SharedValue<inputKeys>;

  topColor: string;
  setTopColor: Dispatch<SetStateAction<string>>;
  bottomColor: string;
  setBottomColor: Dispatch<SetStateAction<string>>;
  solidColorCoinIcons: boolean;
  setSolidColorCoinIcons: Dispatch<SetStateAction<boolean>>;
  isFetching: boolean;
  setIsFetching: Dispatch<SetStateAction<boolean>>;
  isInputSearchFocused: boolean;
  setIsInputSearchFocused: Dispatch<SetStateAction<boolean>>;
  isOutputSearchFocused: boolean;
  setIsOutputSearchFocused: Dispatch<SetStateAction<boolean>>;

  SwapInputController: ReturnType<typeof useSwapInputsController>;
  AnimatedSwapStyles: ReturnType<typeof useAnimatedSwapStyles>;
  SwapTextStyles: ReturnType<typeof useSwapTextStyles>;
  SwapNavigation: ReturnType<typeof useSwapNavigation>;

  confirmButtonIcon: Readonly<SharedValue<string>>;
  confirmButtonLabel: Readonly<SharedValue<string>>;
  confirmButtonIconStyle: StyleProp<TextStyle>;
}

const SwapContext = createContext<SwapContextType | undefined>(undefined);

interface SwapProviderProps {
  children: ReactNode;
}

export const SwapProvider = ({ children }: SwapProviderProps) => {
  const { isDarkMode } = useColorMode();
  const inputProgress = useSharedValue(0);
  const outputProgress = useSharedValue(0);
  const sliderXPosition = useSharedValue(SLIDER_WIDTH * INITIAL_SLIDER_POSITION);
  const sliderPressProgress = useSharedValue(SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT);
  const focusedInput = useSharedValue<inputKeys>('inputAmount');

  const [topColor, setTopColor] = useState(isDarkMode ? ETH_COLOR_DARK : ETH_COLOR);
  const [bottomColor, setBottomColor] = useState(OUTPUT_COLOR);
  const [solidColorCoinIcons, setSolidColorCoinIcons] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isInputSearchFocused, setIsInputSearchFocused] = useState(false);
  const [isOutputSearchFocused, setIsOutputSearchFocused] = useState(false);

  const SwapInputController = useSwapInputsController({
    focusedInput,
    inputAssetBalance: INPUT_ASSET_BALANCE,
    inputAssetUsdPrice: INPUT_ASSET_USD_PRICE,
    outputAssetUsdPrice: OUTPUT_ASSET_USD_PRICE,
    setIsFetching,
    sliderXPosition,
  });

  const AnimatedSwapStyles = useAnimatedSwapStyles({ inputProgress, outputProgress });
  const SwapTextStyles = useSwapTextStyles({
    ...SwapInputController,
    bottomColor,
    focusedInput,
    inputProgress,
    outputProgress,
    sliderPressProgress,
    topColor,
  });

  const SwapNavigation = useSwapNavigation({
    inputProgress,
    outputProgress,
  });

  const confirmButtonIcon = useDerivedValue(() => {
    const isInputZero = Number(SwapInputController.inputValues.value.inputAmount) === 0;
    const isOutputZero = Number(SwapInputController.inputValues.value.outputAmount) === 0;

    if (SwapInputController.inputMethod.value !== 'slider' && (isInputZero || isOutputZero) && !isFetching) {
      return '';
    } else if (SwapInputController.inputMethod.value === 'slider' && SwapInputController.percentageToSwap.value === 0) {
      return '';
    } else {
      return '􀕹';
    }
  }, [isFetching]);

  const confirmButtonLabel = useDerivedValue(() => {
    const isInputZero = Number(SwapInputController.inputValues.value.inputAmount) === 0;
    const isOutputZero = Number(SwapInputController.inputValues.value.outputAmount) === 0;

    if (SwapInputController.inputMethod.value !== 'slider' && (isInputZero || isOutputZero) && !isFetching) {
      return 'Enter Amount';
    } else if (SwapInputController.inputMethod.value === 'slider' && SwapInputController.percentageToSwap.value === 0) {
      return 'Enter Amount';
    } else {
      return 'Review';
    }
  }, [isFetching]);

  const confirmButtonIconStyle = useAnimatedStyle(() => {
    const isInputZero = Number(SwapInputController.inputValues.value.inputAmount) === 0;
    const isOutputZero = Number(SwapInputController.inputValues.value.outputAmount) === 0;

    const sliderCondition = SwapInputController.inputMethod.value === 'slider' && SwapInputController.percentageToSwap.value === 0;
    const inputCondition = SwapInputController.inputMethod.value !== 'slider' && (isInputZero || isOutputZero) && !isFetching;

    const shouldHide = sliderCondition || inputCondition;

    return {
      display: shouldHide ? 'none' : 'flex',
    };
  });

  return (
    <SwapContext.Provider
      value={{
        inputProgress,
        outputProgress,
        sliderXPosition,
        sliderPressProgress,
        focusedInput,
        topColor,
        setTopColor,
        bottomColor,
        setBottomColor,
        solidColorCoinIcons,
        setSolidColorCoinIcons,
        isFetching,
        setIsFetching,
        isInputSearchFocused,
        setIsInputSearchFocused,
        isOutputSearchFocused,
        setIsOutputSearchFocused,
        SwapInputController,
        AnimatedSwapStyles,
        SwapTextStyles,
        SwapNavigation,
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
