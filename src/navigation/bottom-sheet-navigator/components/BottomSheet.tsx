import React, { ReactNode, memo, useCallback, useEffect, useRef } from 'react';
import NativeBottomSheet, {
  useBottomSheetTimingConfigs,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SheetBackdrop } from './SheetBackdrop';
import { Easing, SharedValue } from 'react-native-reanimated';
import { SheetHandleFixedToTop } from '@/components/sheet';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { getDeviceRadius } from '../utils/getDeviceRadius';
import { FullWindowOverlay } from 'react-native-screens';
import { IS_IOS } from '@/env';
import {
  SHEET_ANIMATION_DURATION,
  useBottomSheetState,
} from '../hooks/useBottomSheetState';

type MaybeSharedValue<T> = T | SharedValue<T>;

type Props = {
  snapPoints: MaybeSharedValue<Array<number | string>>;
  handleHeight?: MaybeSharedValue<number>;
  contentHeight?: MaybeSharedValue<number>;
  enableOverDrag?: boolean;
  showHandle?: boolean;
  topInset?: number;
  backgroundStyle?: StyleProp<ViewStyle>;
  // Workaround for ActionSheetIOS rendering behind the modal
  // Can be removed when we stop using `FullWindowOverlay`
  fullWindowOverlay?: boolean;
  children: ({
    containerStyle,
  }: {
    containerStyle: StyleProp<ViewStyle>;
  }) => ReactNode;
};

export function BottomSheet({
  children,
  snapPoints,
  handleHeight,
  contentHeight,
  topInset,
  backgroundStyle,
  fullWindowOverlay = true,
  showHandle = true,
  enableOverDrag = true,
}: Props) {
  const ref = useRef<NativeBottomSheet>(null);
  const safeAreaInsets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Fix for transition from react-native-cool-modals
  const Wrapper =
    IS_IOS && fullWindowOverlay ? FullWindowOverlay : React.Fragment;

  const defaultTimingConfig = useBottomSheetTimingConfigs({
    duration: SHEET_ANIMATION_DURATION,
    easing: Easing.out(Easing.exp),
  });

  const { handleClose } = useBottomSheetState({
    animationTimingConfig: defaultTimingConfig,
    sheetRef: ref,
  });

  // `onClose` handler is unexpectedly firing sometimes
  // or not firing at all, so we use animation index to
  // determine if the modal is in 'closed` state or not
  const onAnimate = useCallback(
    (from: number, to: number) => {
      if (to === -1) {
        handleClose();
      }
    },
    [handleClose]
  );

  return (
    <Wrapper>
      <NativeBottomSheet
        ref={ref}
        animateOnMount
        animationConfigs={defaultTimingConfig}
        backdropComponent={SheetBackdrop}
        enableContentPanningGesture
        enableHandlePanningGesture
        enablePanDownToClose
        enableOverDrag={enableOverDrag}
        backgroundStyle={StyleSheet.flatten([
          bottomSheetStyle.background,
          { backgroundColor: colors.white },
          backgroundStyle,
        ])}
        topInset={topInset ?? safeAreaInsets.top}
        snapPoints={snapPoints}
        handleHeight={handleHeight}
        contentHeight={contentHeight}
        handleComponent={null}
        overDragResistanceFactor={3}
        onAnimate={onAnimate}
      >
        {showHandle && <SheetHandleFixedToTop showBlur={false} />}
        {children({ containerStyle: bottomSheetStyle.containerStyle })}
      </NativeBottomSheet>
    </Wrapper>
  );
}

const SHEET_BORDER_RADIUS = getDeviceRadius();

const bottomSheetStyle = StyleSheet.create({
  background: {
    borderTopLeftRadius: SHEET_BORDER_RADIUS,
    borderTopRightRadius: SHEET_BORDER_RADIUS,
  },
  containerStyle: {
    flex: 1,
    paddingTop: 16,
    borderTopLeftRadius: SHEET_BORDER_RADIUS,
    borderTopRightRadius: SHEET_BORDER_RADIUS,
  },
});
