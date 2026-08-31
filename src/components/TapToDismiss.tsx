import React, { memo } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

import { useNavigation } from '@/navigation/Navigation';

export const TapToDismiss = memo(function TapToDismiss() {
  const { goBack } = useNavigation();
  return (
    <TouchableWithoutFeedback onPress={goBack}>
      <View style={styles.cover} />
    </TouchableWithoutFeedback>
  );
});

const styles = StyleSheet.create({
  // The cover must catch taps across the parent's entire area no matter how that
  // parent lays out its children; anchoring all four edges guarantees that.
  cover: StyleSheet.absoluteFillObject,
});
