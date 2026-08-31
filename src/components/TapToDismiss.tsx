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
  cover: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
});
