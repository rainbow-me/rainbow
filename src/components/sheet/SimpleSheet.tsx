import { IS_ANDROID } from '@/env';
import { safeAreaInsetValues } from '@/utils';
import React from 'react';
import { ScrollView, StatusBar } from 'react-native';
import SlackSheet from './SlackSheet';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';

type SimpleSheetProps = {
  children: React.ReactNode;
  backgroundColor: string;
  customHeight?: number;
  onDismiss?: () => void;
  scrollEnabled?: boolean;
  useAdditionalTopPadding?: boolean;
  testID?: string;
};

const fullSheetHeight = DEVICE_HEIGHT - safeAreaInsetValues.top;

export const SimpleSheet = ({
  children,
  backgroundColor,
  customHeight,
  onDismiss,
  scrollEnabled = true,
  testID,
  useAdditionalTopPadding = false,
}: SimpleSheetProps) => {
  return (
    <SlackSheet
      additionalTopPadding={IS_ANDROID && (!customHeight || useAdditionalTopPadding) ? StatusBar.currentHeight : false}
      contentHeight={customHeight ?? DEVICE_HEIGHT}
      height="100%"
      removeTopPadding
      scrollEnabled={scrollEnabled}
      backgroundColor={backgroundColor}
      onDismiss={onDismiss}
      testID={testID}
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
