import { createContext } from 'react';

interface BottomSheetNavigatorContextType {
  setSnapPoints: (snapPoints: string[] | number[]) => void;
  setEnableHandlePanningGesture: (value: boolean) => void;
  setEnableContentPanningGesture: (value: boolean) => void;
}

export const BottomSheetNavigatorContext = createContext<BottomSheetNavigatorContextType | null>(null);
