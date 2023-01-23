import { IS_ANDROID } from '@/env';
import { useDimensions } from '@/hooks';
import React from 'react';
import { ScrollView, StatusBar } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import SlackSheet from './SlackSheet';

type SimpleSheetProps = {
  children: React.ReactNode;
  backgroundColor: string;
  customHeight?: number;
  scrollEnabled?: boolean;
};

export const SimpleSheet = ({
  children,
  backgroundColor,
  customHeight,
  scrollEnabled = true,
}: SimpleSheetProps) => {
  const { height: deviceHeight } = useDimensions();
  const statusBarHeight = getStatusBarHeight(true);
  const fullSheetHeight = deviceHeight - statusBarHeight;

  return (
    // @ts-expect-error JavaScript component
    <SlackSheet
      additionalTopPadding={
        IS_ANDROID && !customHeight ? StatusBar.currentHeight : false
      }
      contentHeight={customHeight ?? deviceHeight}
      height="100%"
      removeTopPadding
      scrollEnabled={scrollEnabled}
      backgroundColor={backgroundColor}
    >
      <ScrollView
        scrollEnabled={scrollEnabled}
        style={{
          top: 0,
          backgroundColor: backgroundColor,
        }}
        contentContainerStyle={{
          minHeight: customHeight ?? fullSheetHeight,
        }}
      >
        {children}
      </ScrollView>
    </SlackSheet>
  );
};
