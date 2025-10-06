import React, { memo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { IS_IOS } from '@/env';

/**
 * #### `🪤 DecoyScrollView 🪤`
 *
 * A decoy ScrollView meant to be used within our native iOS sheets. Prevents
 * the native sheet gesture from connecting to your *real* ScrollView. Make sure
 * the decoy is rendered after the real ScrollView. The decoy is invisible.
 */
export const DecoyScrollView = memo(function DecoyScrollView() {
  return IS_IOS ? <ScrollView scrollEnabled style={styles.decoyScrollView} /> : null;
});

const styles = StyleSheet.create({
  decoyScrollView: {
    height: 0,
    opacity: 0,
    pointerEvents: 'none',
    position: 'absolute',
    width: 0,
  },
});
