import React, { ReactNode } from 'react';
import NativeBottomSheet from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/core';
import { SheetBackdrop } from './SheetBackdrop';
import { SharedValue } from 'react-native-reanimated';
import { SheetHandleFixedToTop } from '@/components/sheet';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

const SHEET_BORDER_RADIUS = 40;

type MaybeSharedValue<T> = T | SharedValue<T>;

type Props = {
  snapPoints: MaybeSharedValue<Array<number | string>>;
  handleHeight?: MaybeSharedValue<number>;
  contentHeight?: MaybeSharedValue<number>;
  enableOverDrag?: boolean;
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
  enableOverDrag = true,
}: Props) {
  const navigation = useNavigation();
  const safeAreaInsets = useSafeAreaInsets();

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <NativeBottomSheet
      animateOnMount
      backdropComponent={SheetBackdrop}
      enableContentPanningGesture
      enableHandlePanningGesture
      enablePanDownToClose
      enableOverDrag={enableOverDrag}
      backgroundStyle={bottomSheetStyle.background}
      onClose={handleClose}
      topInset={safeAreaInsets.top}
      snapPoints={snapPoints}
      handleHeight={handleHeight}
      contentHeight={contentHeight}
      handleComponent={null}
    >
      <SheetHandleFixedToTop showBlur={false} />
      {children({ containerStyle: bottomSheetStyle.containerStyle })}
    </NativeBottomSheet>
  );
}

const bottomSheetStyle = StyleSheet.create({
  background: {
    backgroundColor: 'white',
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
