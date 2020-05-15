import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../styles';

const sx = StyleSheet.create({
  divider: {
    backgroundColor: colors.rowDividerLight,
    borderRadius: 1,
    height: 2,
    marginLeft: 19,
    opacity: 1,
    width: '100%',
  },
});

const WalletDivider = () => <View style={sx.divider} />;

export default WalletDivider;
