import { useContext } from 'react';
import { BottomSheetNavigatorContext } from '../context/BottomSheetNavigatorContext';

export function useBottomSheetNavigatorContext() {
  const bottomSheetNavigatorContext = useContext(BottomSheetNavigatorContext);

  if (!bottomSheetNavigatorContext) {
    throw new Error(
      'useBottomSheetNavigatorContext hook must be wrapped in BottomSheetNavigatorContext'
    );
  }

  return bottomSheetNavigatorContext;
}
