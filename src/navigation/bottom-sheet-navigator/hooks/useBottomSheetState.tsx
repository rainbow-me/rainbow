import { RefObject, useEffect } from 'react';
import { WithTimingConfig } from 'react-native-reanimated';
import NativeBottomSheet from '@gorhom/bottom-sheet';
import { useNavigation } from '@/navigation/Navigation';
import { useBottomSheetNavigatorContext } from './useBottomSheetNavigatorContext';

export const SHEET_ANIMATION_DURATION = 300;

type BottomSheetConfig = {
  animationTimingConfig: WithTimingConfig;
  sheetRef: RefObject<NativeBottomSheet>;
};

export function useBottomSheetState({
  animationTimingConfig,
  sheetRef,
}: BottomSheetConfig) {
  const {
    onClose,
    removing: navigationRemoving,
  } = useBottomSheetNavigatorContext();
  const navigation = useNavigation();

  useEffect(() => {
    if (!navigationRemoving) {
      return;
    }

    sheetRef.current?.close(animationTimingConfig);
  }, [navigationRemoving, animationTimingConfig, sheetRef]);

  const handleClose = () => {
    if (!navigationRemoving) {
      navigation.goBack();
    }

    onClose();
  };

  return {
    handleClose,
  };
}
