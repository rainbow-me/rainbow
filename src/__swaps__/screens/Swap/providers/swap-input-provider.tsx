import React, { createContext, useContext, ReactNode, SetStateAction, Dispatch, useState } from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';
import { inputKeys } from '../types/swap';
import { INITIAL_SLIDER_POSITION, SLIDER_COLLAPSED_HEIGHT, SLIDER_HEIGHT, SLIDER_WIDTH } from '../constants';
import { useSwapTextStyles } from '../hooks/useSwapTextStyles';
import { useSwapInputsController } from '../hooks/useSwapInputsController';
import { useSwapAssetStore } from '../state/assets';

interface SwapContextType {
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
  sliderXPosition: SharedValue<number>;
  sliderPressProgress: SharedValue<number>;
  focusedInput: SharedValue<inputKeys>;

  isFetching: boolean;
  setIsFetching: Dispatch<SetStateAction<boolean>>;

  SwapInputController: ReturnType<typeof useSwapInputsController>;
  SwapTextStyles: ReturnType<typeof useSwapTextStyles>;
}

const SwapContext = createContext<SwapContextType | undefined>(undefined);

interface SwapProviderProps {
  children: ReactNode;
}

export const SwapInputProvider = ({ children }: SwapProviderProps) => {
  const inputProgress = useSharedValue(0);
  const outputProgress = useSharedValue(0);
  const sliderXPosition = useSharedValue(SLIDER_WIDTH * INITIAL_SLIDER_POSITION);
  const sliderPressProgress = useSharedValue(SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT);

  const { assetToBuy, assetToSell } = useSwapAssetStore();

  const [isFetching, setIsFetching] = useState(false);
  const focusedInput = useSharedValue<inputKeys>('inputAmount');

  const SwapInputController = useSwapInputsController({
    focusedInput,
    inputAssetBalance: Number(assetToSell?.balance.amount ?? -1),
    inputAssetUsdPrice: assetToSell?.native.price?.amount ?? -1,
    outputAssetUsdPrice: assetToBuy?.native.price?.amount ?? -1,
    setIsFetching,
    sliderXPosition,
  });

  const SwapTextStyles = useSwapTextStyles({
    ...SwapInputController,
    focusedInput,
    inputProgress,
    outputProgress,
    sliderPressProgress,
  });

  return (
    <SwapContext.Provider
      value={{
        inputProgress,
        outputProgress,
        sliderXPosition,
        sliderPressProgress,
        focusedInput,
        isFetching,
        setIsFetching,
        SwapInputController,
        SwapTextStyles,
      }}
    >
      {children}
    </SwapContext.Provider>
  );
};

export const useSwapInputProvider = () => {
  const context = useContext(SwapContext);
  if (context === undefined) {
    throw new Error('useSwap must be used within a SwapProvider');
  }
  return context;
};
