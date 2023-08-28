import { createContext } from 'react';

type BottomSheetNavigatorContextType = {
  onClose: () => void;
  removing: boolean;
};

const BottomSheetNavigatorContext = createContext<
  BottomSheetNavigatorContextType | undefined
>(undefined);

export { BottomSheetNavigatorContext };
