import React from 'react';
import { View } from 'react-native';
import { useForegroundColor } from '../color/useForegroundColor';

export const Placeholder = ({ height = 40, width, flexGrow }: { flexGrow?: number; height?: number | '100%'; width?: number | '100%' }) => {
  const backgroundColor = useForegroundColor('fillSecondary');
  const borderColor = useForegroundColor('scrim');
  return (
    <View
      style={{
        backgroundColor,
        borderColor,
        borderWidth: 1,
        flexGrow,
        height,
        width,
      }}
    />
  );
};
