import React from 'react';
import { View } from 'react-native';

export const Placeholder = ({
  height = 40,
  width,
  flexGrow,
}: {
  flexGrow?: number;
  height?: number;
  width?: number | '100%';
}) => (
  <View
    style={{
      backgroundColor: 'rgba(180, 180, 180, 0.3)',
      borderColor: 'rgba(150, 150, 150, 0.6)',
      borderRadius: 14,
      borderWidth: 2,
      flexGrow,
      height,
      width,
    }}
  />
);
