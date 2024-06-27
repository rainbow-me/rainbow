import React from 'react';
import { View } from 'react-native';

export const LineBreak = ({ lines = 1 }: { lines?: number }) => {
  return <View style={{ height: lines * 15 }} />;
};
