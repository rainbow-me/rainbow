import { useContext } from 'react';
import { BottomSheetNavigatorContext } from '../contexts/internal';

export const useBottomSheetNavigator = () => {
  const context = useContext(BottomSheetNavigatorContext);

  if (context === null) {
    throw new Error('BottomSheetNavigatorContext cannot be null.');
  }

  return context;
};
