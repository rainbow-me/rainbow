import React from 'react';
import { View, type ColorValue } from 'react-native';

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
  const sheetHeight = customHeight ?? deviceHeight - insets.top;
  return (
    <SlackSheet
      additionalTopPadding={useAdditionalTopPadding}
      contentHeight={sheetHeight}
      height="100%"
      removeTopPadding
      scrollEnabled={scrollEnabled}
      backgroundColor={backgroundColor}
      onDismiss={onDismiss}
      testID={testID}
    >
      <View style={{ flexBasis: sheetHeight, minHeight: sheetHeight }}>{children}</View>
    </SlackSheet>
  );
};
