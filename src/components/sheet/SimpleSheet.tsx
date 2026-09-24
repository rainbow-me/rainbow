import React from 'react';
import { ScrollView, View, type ColorValue } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useDimensions from '@/hooks/useDimensions';

import SlackSheet from './SlackSheet';

type SimpleSheetBaseProps = {
  children: React.ReactNode;
  backgroundColor?: string | ColorValue;
  customHeight?: number;
  onDismiss?: () => void;
  useAdditionalTopPadding?: boolean;
  testID?: string;
};

type SimpleSheetProps = SimpleSheetBaseProps &
  (
    | {
        contentContainer?: 'scroll';
        scrollEnabled?: boolean;
      }
    | {
        contentContainer: 'view';
        scrollEnabled?: never;
      }
  );

export const SimpleSheet = ({
  children,
  backgroundColor,
  contentContainer = 'scroll',
  customHeight,
  onDismiss,
  scrollEnabled,
  testID,
  useAdditionalTopPadding = false,
}: SimpleSheetProps) => {
  const insets = useSafeAreaInsets();
  const { height: deviceHeight } = useDimensions();
  const fullSheetHeight = deviceHeight - insets.top;
  const sheetScrollEnabled = contentContainer === 'scroll' ? (scrollEnabled ?? true) : false;
  const content =
    contentContainer === 'scroll' ? (
      <ScrollView
        scrollEnabled={sheetScrollEnabled}
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
      scrollEnabled={sheetScrollEnabled}
      backgroundColor={backgroundColor}
      onDismiss={onDismiss}
      testID={testID}
    >
      {content}
    </SlackSheet>
  );
};
