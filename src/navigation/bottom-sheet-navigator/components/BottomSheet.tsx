import React, { ReactNode, useEffect, useRef } from 'react';
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
import { useBottomSheetNavigatorContext } from '../hooks/useBottomSheetNavigatorContext';
import { useNavigation } from '@react-navigation/core';
import { FullWindowOverlay } from 'react-native-screens';
import { IS_IOS } from '@/env';

type MaybeSharedValue<T> = T | SharedValue<T>;

type Props = {
  snapPoints: MaybeSharedValue<Array<number | string>>;
  handleHeight?: MaybeSharedValue<number>;
  contentHeight?: MaybeSharedValue<number>;
  enableOverDrag?: boolean;
  showHandle?: boolean;
  topInset?: number;
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
  fullWindowOverlay = true,
  showHandle = true,
  enableOverDrag = true,
}: Props) {
  const { onClose, removing } = useBottomSheetNavigatorContext();
  const navigation = useNavigation();
  const ref = useRef<NativeBottomSheet>(null);
  const safeAreaInsets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Fix for transition from react-native-cool-modals
  const Wrapper =
    IS_IOS && fullWindowOverlay ? FullWindowOverlay : React.Fragment;

  const defaultTimingConfig = useBottomSheetTimingConfigs({
    duration: 300,
    easing: Easing.out(Easing.exp),
  });

  useEffect(() => {
    if (removing) {
      ref.current?.close(defaultTimingConfig);
    }
  }, [removing, defaultTimingConfig]);

  const handleClose = () => {
    if (!removing) {
      navigation.goBack();
    }

    onClose();
  };

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
        backgroundStyle={{
          ...bottomSheetStyle.background,
          backgroundColor: colors.white,
        }}
        onClose={handleClose}
        topInset={topInset ?? safeAreaInsets.top}
        snapPoints={snapPoints}
        handleHeight={handleHeight}
        contentHeight={contentHeight}
        handleComponent={null}
        overDragResistanceFactor={3}
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
