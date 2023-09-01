import React from 'react';
import { BottomSheet } from './BottomSheet';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

type Props = {
  snapPoints?: Array<string | number>;
  style?: StyleProp<ViewStyle>;
  fullWindowOverlay?: boolean;
};

export function ModalBottomSheet({
  snapPoints = ['100%'],
  style,
  children,
}: React.PropsWithChildren<Props>) {
  return (
    <BottomSheet
      snapPoints={snapPoints}
      showHandle={false}
      fullWindowOverlay={false}
      backgroundStyle={{
        backgroundColor: 'transparent',
      }}
    >
      {({ containerStyle }) => (
        <BottomSheetView style={StyleSheet.flatten([containerStyle, style])}>
          {children}
        </BottomSheetView>
      )}
    </BottomSheet>
  );
}
