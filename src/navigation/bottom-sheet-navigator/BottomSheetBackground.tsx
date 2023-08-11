import { useBottomSheet } from '@gorhom/bottom-sheet';
import React, { useCallback } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

export const BottomSheetBackground = () => {
  const { close } = useBottomSheet();

  const handleOnPress = useCallback(() => {
    close();
  }, [close]);

  return (
    <TouchableWithoutFeedback onPress={handleOnPress} style={styles.container}>
      <View style={styles.container} />
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
