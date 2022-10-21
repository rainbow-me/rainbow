import { useRoute } from '@react-navigation/core';
import React, { useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';
import { Centered, FlexItem } from '../components/layout';
import { reserveWyreOrder } from '../handlers/wyre';
import { StatusBarHelper } from '@/helpers';
import { useAccountSettings, useDimensions } from '@/hooks';
import styled from '@/styled-thing';
import { useTheme } from '@/theme';
import ActivityIndicator from '@/components/ActivityIndicator';
import Spinner from '@/components/Spinner';
import {
  SheetHandleFixedToTopHeight,
  SheetTitle,
  SlackSheet,
} from '@/components/sheet';
import { Box, DebugLayout, Text, useForegroundColor } from '@/design-system';
import { ScrollView } from 'react-native-gesture-handler';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import { backgroundColors, globalColors } from '@/design-system/color/palettes';

const HEADER_HEIGHT = 60;

const Container = styled(FlexItem)({
  backgroundColor: ({ theme: { colors } }) => colors.white,
});

const StyledWebView = styled(WebView)({
  backgroundColor: ({ theme: { colors } }) => colors.white,
});

export default function WebViewScreen() {
  const {
    params: { title, url },
  } = useRoute();

  // useEffect(() => {
  //   StatusBarHelper.setBackgroundColor('transparent', false);
  //   StatusBarHelper.setTranslucent(true);
  //   StatusBarHelper.setDarkContent();
  // }, []);

  const defaultInputWidth = 180;

  const { colors, isDarkMode } = useTheme();

  const { height: deviceHeight, isSmallPhone } = useDimensions();

  const contentHeight =
    deviceHeight -
    HEADER_HEIGHT -
    (!isSmallPhone ? sharedCoolModalTopOffset : 0);

  const LoadingSpinner = android ? Spinner : ActivityIndicator;

  return (
    <SlackSheet
      renderHeader={() => (
        <Box
          top="0px"
          background="surfacePrimary"
          height={{ custom: HEADER_HEIGHT }}
          width="full"
          justifyContent="center"
          alignItems="center"
        >
          <Text align="center" color="label" size="20pt" weight="heavy">
            {title}
          </Text>
        </Box>
      )}
      backgroundColor={
        isDarkMode ? globalColors.grey100 : globalColors.white100
      }
      contentHeight={contentHeight}
      height="100%"
      removeTopPadding
    >
      <DebugLayout>
        <Box width="full" height={{ custom: contentHeight }}>
          <WebView
            startInLoadingState
            renderLoading={() => (
              <Box
                background="surfacePrimary"
                width="full"
                height="full"
                alignItems="center"
                justifyContent="center"
              >
                <LoadingSpinner />
              </Box>
            )}
            source={{
              uri: url,
            }}
          />
        </Box>
      </DebugLayout>
    </SlackSheet>
  );
}
