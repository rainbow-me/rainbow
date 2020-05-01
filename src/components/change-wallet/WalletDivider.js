import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../styles';

const sx = StyleSheet.create({
  divider: {
    backgroundColor: colors.blueGreyLighter,
    height: 2,
    opacity: 1,
    width: '100%',
  },
  dividerWrapper: {
    paddingTop: 2,
  },
});

const WalletDivider = () => (
  <View style={sx.dividerWrapper}>
    <View style={sx.divider} />
  </View>
);

export default WalletDivider;
