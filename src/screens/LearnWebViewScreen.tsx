import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Share, View } from 'react-native';

import { useRoute, type RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';

import { analytics } from '@/analytics';
import ActivityIndicator from '@/components/ActivityIndicator';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { SlackSheet } from '@/components/sheet';
import Spinner from '@/components/Spinner';
import { Box, Text, useBackgroundColor } from '@/design-system';
import { globalColors } from '@/design-system/color/palettes';
import useDimensions from '@/hooks/useDimensions';
import * as i18n from '@/languages';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import type Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeContext';
import { buildRainbowLearnUrl, LearnUTMCampaign } from '@/utils/buildRainbowUrl';

const HEADER_HEIGHT = 60;

export default function LearnWebViewScreen() {
  const {
    params: { key, displayType, category, url, routeName },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.LEARN_WEB_VIEW_SCREEN>>();
  const { isDarkMode } = useTheme();
  const { height: deviceHeight, isSmallPhone } = useDimensions();
  const [webViewHeight, setWebViewHeight] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(
    () => () => {
      analytics.track(analytics.event.learnArticleOpened, {
        durationSeconds: (Date.now() - startTime.current) / 1000,
        url,
        cardId: key,
        category,
        displayType,
        routeName,
      });
      return;
    },
    [category, displayType, key, routeName, url]
  );

  const onPressShare = useCallback(async () => {
    const shared = await Share.share({ url });
    if (shared.action === Share.sharedAction) {
      analytics.track(analytics.event.learnArticleShared, {
        url,
        category,
        cardId: key,
        durationSeconds: (Date.now() - startTime.current) / 1000,
      });
    }
  }, [category, key, url]);

  const renderHeader = () => (
    <Box
      top="0px"
      background="surfacePrimaryElevated"
      height={{ custom: HEADER_HEIGHT }}
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

  const contentHeight = deviceHeight - (!isSmallPhone ? sharedCoolModalTopOffset : 0);

  const LoadingSpinner = Platform.OS === 'android' ? Spinner : ActivityIndicator;

  const surfacePrimaryElevated = useBackgroundColor('surfacePrimaryElevated');

  const injectedJavaScript = `
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = \`
      .super-navbar.simple, .notion-header__icon-wrapper, .intercom-lightweight-app { display: none; }
      body { background-color: ${surfacePrimaryElevated}; }
    \`;

    if (${isDarkMode}) {
      style.innerHTML += \`
        h1, h2, h3, h4, h5, p, li, .notion-callout__content { color: white; }
        .bg-gray-light { background-color: ${globalColors.white30}; }
        .notion-callout.bg-gray-light.border { border-color: ${globalColors.white30}; }
      \`;
    }

    document.head.appendChild(style);

    const updateHeight = () => {
      window.ReactNativeWebView.postMessage(String(document.body.scrollHeight - 270));
    };

    window.addEventListener('load', updateHeight);
    window.addEventListener('resize', updateHeight);

    updateHeight();
  `;

  return (
    <SlackSheet
      renderHeader={renderHeader}
      backgroundColor={surfacePrimaryElevated}
      contentContainerStyle={{ flexGrow: 1 }}
      contentHeight={contentHeight}
      height="100%"
      removeTopPadding
      additionalTopPadding
    >
      <View pointerEvents="none">
        <WebView
          injectedJavaScript={injectedJavaScript}
          startInLoadingState
          renderLoading={() => (
            <Box
              background="surfacePrimaryElevated"
              width="full"
              height={{ custom: contentHeight }}
              paddingBottom={{ custom: HEADER_HEIGHT }}
              alignItems="center"
              justifyContent="center"
            >
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
              /* @ts-ignore - JS component */}
              <LoadingSpinner />
            </Box>
          )}
          onMessage={event => setWebViewHeight(Number(event.nativeEvent.data))}
          style={{
            height: webViewHeight,
          }}
          source={{
            uri: buildRainbowLearnUrl({
              url,
              query: {
                campaign: LearnUTMCampaign.Card,
                isDarkMode,
              },
            }),
          }}
        />
      </View>
    </SlackSheet>
  );
}
