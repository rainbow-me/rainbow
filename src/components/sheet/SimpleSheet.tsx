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
  const { height: deviceHeight } = useDimensions();

  const additionalTopPadding = useAdditionalTopPadding ? safeAreaInsetValues.top : 0;

  const calculatedCustomHeight = customHeight ?? deviceHeight - safeAreaInsetValues.top;

  return (
    <SlackSheet
      additionalTopPadding={additionalTopPadding}
      contentHeight={calculatedCustomHeight}
      height="100%"
      scrollEnabled={scrollEnabled}
      backgroundColor={backgroundColor}
      onDismiss={onDismiss}
      testID={testID}
    >
      <ScrollView
        scrollEnabled={scrollEnabled}
        style={{
          backgroundColor: backgroundColor,
        }}
        contentContainerStyle={{
          minHeight: calculatedCustomHeight,
        }}
      >
        {children}
      </ScrollView>
    </SlackSheet>
  );
};
