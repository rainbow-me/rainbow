import { useDimensions } from '@/hooks';
import React from 'react';
import { View } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SheetHandleFixedToTopHeight } from './SheetHandleFixedToTop';

type SheetContainerProps = {
  children: React.ReactNode;
  sheetHeight?: number;
};

export const SheetContainer = ({
  children,
  sheetHeight,
}: SheetContainerProps) => {
  const { bottom: safeAreaInsetBottom } = useSafeAreaInsets();
  const { height: deviceHeight } = useDimensions();
  const statusBarHeight = getStatusBarHeight(true);
  const fullSheetHeight = deviceHeight - statusBarHeight;

  return (
    <View
      style={{
        height: sheetHeight ?? fullSheetHeight,
        top: 0,
        paddingTop: SheetHandleFixedToTopHeight,
        paddingBottom: safeAreaInsetBottom,
      }}
    >
      {children}
    </View>
  );
};
