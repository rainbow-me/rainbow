import React from 'react';
import { BottomSheet } from './BottomSheet';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import TouchableBackdrop from '@/components/TouchableBackdrop';
import { useNavigation } from '@/navigation';

type Props = {
  style?: StyleProp<ViewStyle>;
};

export function ModalBottomSheet({
  style,
  children,
}: React.PropsWithChildren<Props>) {
  const { goBack } = useNavigation();
  return (
    <BottomSheet
      snapPoints={['100%']}
      showHandle={false}
      fullWindowOverlay={false}
      backgroundStyle={{
        backgroundColor: 'transparent',
      }}
      topInset={0}
    >
      {({ containerStyle }) => (
        <BottomSheetView style={StyleSheet.flatten([containerStyle, style])}>
          <TouchableBackdrop onPress={goBack} style={styles.backdrop} />
          <View style={styles.viewContainer}>{children}</View>
        </BottomSheetView>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  viewContainer: {
    zIndex: 2,
  },
  backdrop: {
    zIndex: 1,
  },
});
