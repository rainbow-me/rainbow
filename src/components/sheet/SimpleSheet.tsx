import { IS_ANDROID } from '@/env';
import { useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import { safeAreaInsetValues } from '@/utils';
import React, { useEffect, useState } from 'react';
import { ScrollView, StatusBar, View } from 'react-native';
import SlackSheet from './SlackSheet';

type SimpleSheetProps = {
  children: React.ReactNode;
  backgroundColor: string;
  height: 'full' | 'auto';
  onDismiss?: () => void;
  scrollEnabled?: boolean;
};

export const SimpleSheet = ({
  children,
  backgroundColor,
  height,
  onDismiss,
  scrollEnabled = true,
}: SimpleSheetProps) => {
  const { height: deviceHeight } = useDimensions();
  const { setParams } = useNavigation();
  const [autoHeight, setAutoHeight] = useState<number>();
  const fullSheetHeight = deviceHeight - safeAreaInsetValues.top;

  console.log(fullSheetHeight);

  useEffect(
    () =>
      setParams({
        sheetHeight: height === 'full' ? fullSheetHeight : autoHeight,
      }),
    [autoHeight, deviceHeight, fullSheetHeight, height, setParams]
  );

  return (
    // @ts-expect-error JavaScript component
    <SlackSheet
      additionalTopPadding={
        IS_ANDROID && height === 'full' ? StatusBar.currentHeight : false
      }
      contentHeight={height === 'full' ? deviceHeight : autoHeight}
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
          minHeight: height === 'full' ? fullSheetHeight : autoHeight,
        }}
      >
        <View onLayout={e => setAutoHeight(e.nativeEvent.layout.height)}>
          {children}
        </View>
      </ScrollView>
    </SlackSheet>
  );
};
