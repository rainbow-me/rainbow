import { VibrancyView } from '@react-native-community/blur';
import React, { createElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../styles';

export const HandleHeight = 5;

const sx = StyleSheet.create({
  handle: {
    backgroundColor: colors.alpha(colors.blueGreyDark, 0.3),
    borderRadius: 3,
    height: HandleHeight,
    overflow: 'hidden',
    width: 36,
  },
});

const SheetHandle = ({ showBlur, ...props }) =>
  createElement(showBlur ? VibrancyView : View, {
    blurAmount: 20,
    blurType: 'light',
    style: sx.handle,
    ...props,
  });

const neverRerender = () => true;
export default React.memo(SheetHandle, neverRerender);
