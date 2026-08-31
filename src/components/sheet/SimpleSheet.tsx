import React from 'react';
import { ScrollView, View, type ColorValue } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useDimensions from '@/hooks/useDimensions';

import SlackSheet from './SlackSheet';

type SimpleSheetProps = {
  children: React.ReactNode;
  backgroundColor?: string | ColorValue;
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
  const content = scrollEnabled ? (
    <ScrollView
      style={{ backgroundColor }}
      contentContainerStyle={{
        minHeight: customHeight ?? fullSheetHeight,
      }}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={{ backgroundColor, height: customHeight ?? fullSheetHeight }}>{children}</View>
  );

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
      {content}
    </SlackSheet>
  );
};
