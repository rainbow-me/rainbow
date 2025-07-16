import { IS_ANDROID } from '@/env';
import { useDimensions } from '@/hooks';
import React from 'react';
import { ScrollView, StatusBar } from 'react-native';
import SlackSheet from './SlackSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SimpleSheetProps = {
  children: React.ReactNode;
  backgroundColor: string;
  customHeight?: number;
  onDismiss?: () => void;
  scrollEnabled?: boolean;
  useAdditionalTopPadding?: boolean;
  testID?: string;
};

export const SimpleSheet = ({
  children,
  backgroundColor,
  customHeight,
  onDismiss,
  scrollEnabled = true,
  testID,
  useAdditionalTopPadding = false,
}: SimpleSheetProps) => {
  const insets = useSafeAreaInsets();
  const { height: deviceHeight } = useDimensions();
  const fullSheetHeight = deviceHeight - insets.top;
  return (
    <SlackSheet
      additionalTopPadding={useAdditionalTopPadding}
      contentHeight={customHeight ?? fullSheetHeight}
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
