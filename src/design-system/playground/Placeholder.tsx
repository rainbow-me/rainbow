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
      backgroundColor: '#eee',
      borderColor: '#aaa',
      borderWidth: 1,
      flexGrow,
      height,
      width,
    }}
  />
);
