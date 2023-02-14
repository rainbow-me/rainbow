import { IS_ANDROID } from '@/env';
import { useDimensions } from '@/hooks';
import { safeAreaInsetValues } from '@/utils';
import React from 'react';
import { ScrollView, StatusBar } from 'react-native';
import SlackSheet from './SlackSheet';

type SimpleSheetProps = {
  children: React.ReactNode;
  backgroundColor: string;
  customHeight?: number;
  onDismiss?: () => void;
  scrollEnabled?: boolean;
};

export const SimpleSheet = ({
  children,
  backgroundColor,
  customHeight,
  onDismiss,
  scrollEnabled = true,
}: SimpleSheetProps) => {
  const { height: deviceHeight } = useDimensions();
  const fullSheetHeight = deviceHeight - safeAreaInsetValues.top;

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
      onDismiss={onDismiss}
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
