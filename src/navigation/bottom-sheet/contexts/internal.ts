import { createContext } from 'react';
import Animated from 'react-native-reanimated';

interface BottomSheetNavigatorContextType {
  setSnapPoints: (snapPoints: string[] | number[]) => void;
  setEnableHandlePanningGesture: (value: boolean) => void;
  setEnableContentPanningGesture: (value: boolean) => void;
  animatedIndex: Animated.SharedValue<number>;
}

export const BottomSheetNavigatorContext = createContext<BottomSheetNavigatorContextType | null>(
  null
);
