import { SheetHandleFixedToTopHeight } from '@/components/sheet';
import { useDimensions } from '@/hooks';
import React from 'react';
import { View } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';

type NavigatorContainerProps = {
  children: React.ReactNode;
  sheetHeight?: number;
};

export const NavigatorContainer = ({
  children,
  sheetHeight,
}: NavigatorContainerProps) => {
  const { height: deviceHeight } = useDimensions();
  const statusBarHeight = getStatusBarHeight(true);
  const fullSheetHeight = deviceHeight - statusBarHeight;

  return (
    <View
      style={{
        height: sheetHeight ?? fullSheetHeight,
        top: 0,
        paddingTop: SheetHandleFixedToTopHeight,
      }}
    >
      {children}
    </View>
  );
};
