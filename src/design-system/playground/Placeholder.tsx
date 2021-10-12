import React from 'react';
import { View } from 'react-native';

export const PlaceHolder = ({
  height = 40,
  width = '100%',
}: {
  height?: number;
  width?: number | '100%';
}) => (
  <View
    style={{
      backgroundColor: '#eee',
      borderColor: '#aaa',
      borderWidth: 1,
      height,
      width,
    }}
  />
);
