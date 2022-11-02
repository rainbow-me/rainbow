import { useRoute } from '@react-navigation/core';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Share, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDimensions } from '@/hooks';
import { useTheme } from '@/theme';
import ActivityIndicator from '@/components/ActivityIndicator';
import Spinner from '@/components/Spinner';
import { SlackSheet } from '@/components/sheet';
import { Box, Text } from '@/design-system';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import { globalColors } from '@/design-system/color/palettes';
import { ButtonPressAnimation } from '@/components/animations';
import { IS_ANDROID } from '@/env';
import { analytics } from '@/analytics';
import * as i18n from '@/languages';

const HeaderHeight = 60;

export default function LearnWebViewScreen() {
  const {
    params: { cardType, category, title, url },
  }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any = useRoute();
  const { isDarkMode } = useTheme();
  const { height: deviceHeight, isSmallPhone } = useDimensions();
  const [webViewHeight, setWebViewHeight] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(
    () => () => {
      analytics.track('Learn card opened', {
        durationSeconds: (Date.now() - startTime.current) / 1000,
        url,
        title,
        category,
        cardType,
      });
      return;
    },
    [cardType, category, title, url]
  );

  const onPressShare = useCallback(async () => {
    await Share.share({ url });
    analytics.track('Learn card web view share modal opened', {
      url,
      category,
      title,
      cardType,
    });
  }, [cardType, category, title, url]);

  const renderHeader = () => (
    <Box
      top="0px"
      background="surfacePrimary"
      height={{ custom: HeaderHeight }}
      width="full"
      justifyContent="center"
      alignItems="center"
    >
      <Text align="center" color="label" size="20pt" weight="heavy">
        {i18n.t(i18n.l.cards.learn.learn)}
      </Text>
      <Box position="absolute" right={{ custom: 20 }}>
        <ButtonPressAnimation onPress={onPressShare}>
          <Text align="center" color="label" size="20pt" weight="bold">
            􀈂
          </Text>
        </ButtonPressAnimation>
      </Box>
    </Box>
  );

  const contentHeight =
    deviceHeight -
    HeaderHeight -
    (!isSmallPhone ? sharedCoolModalTopOffset : 0);

  const LoadingSpinner = IS_ANDROID ? Spinner : ActivityIndicator;

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - JS component
    <SlackSheet
      renderHeader={renderHeader}
      backgroundColor={
        isDarkMode ? globalColors.grey100 : globalColors.white100
      }
      contentContainerStyle={{ flexGrow: 1 }}
      contentHeight={contentHeight}
      height="100%"
      removeTopPadding
      additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
    >
      <WebView
        startInLoadingState
        renderLoading={() => (
          <Box
            background="surfacePrimary"
            width="full"
            height={{ custom: contentHeight }}
            alignItems="center"
            justifyContent="center"
          >
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
            /* @ts-ignore - JS component */}
            <LoadingSpinner />
          </Box>
        )}
        onMessage={event => setWebViewHeight(Number(event.nativeEvent.data))}
        injectedJavaScript="window.ReactNativeWebView.postMessage(document.body.scrollHeight)"
        style={{
          height: webViewHeight,
        }}
        source={{
          uri: `${url}${isDarkMode ? '?theme=dark' : ''}`,
        }}
      />
    </SlackSheet>
  );
}
