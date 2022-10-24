import { useRoute } from '@react-navigation/core';
import React from 'react';
import { Share } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDimensions } from '@/hooks';
import { useTheme } from '@/theme';
import ActivityIndicator from '@/components/ActivityIndicator';
import Spinner from '@/components/Spinner';
import { SlackSheet } from '@/components/sheet';
import { Box, DebugLayout, Text } from '@/design-system';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import { globalColors } from '@/design-system/color/palettes';
import { ButtonPressAnimation } from '@/components/animations';
import { IS_ANDROID } from '@/env';

const HeaderHeight = 60;

export default function WebViewScreen() {
  const {
    params: { title, url },
  }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any = useRoute();

  // useEffect(() => {
  //   StatusBarHelper.setBackgroundColor('transparent', false);
  //   StatusBarHelper.setTranslucent(true);
  //   StatusBarHelper.setDarkContent();
  // }, []);

  const { isDarkMode } = useTheme();

  const { height: deviceHeight, isSmallPhone } = useDimensions();

  const contentHeight =
    deviceHeight -
    HeaderHeight -
    (!isSmallPhone ? sharedCoolModalTopOffset : 0);

  const LoadingSpinner = IS_ANDROID ? Spinner : ActivityIndicator;

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - JS component
    <SlackSheet
      renderHeader={() => (
        <Box
          top="0px"
          background="surfacePrimary"
          height={{ custom: HeaderHeight }}
          width="full"
          justifyContent="center"
          alignItems="center"
        >
          <Text align="center" color="label" size="20pt" weight="heavy">
            {title}
          </Text>
          <Box position="absolute" right={{ custom: 20 }}>
            <ButtonPressAnimation
              onPress={async () => await Share.share({ url })}
            >
              <Text align="center" color="label" size="20pt" weight="heavy">
                􀈂
              </Text>
            </ButtonPressAnimation>
          </Box>
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
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
                /* @ts-ignore - JS component */}
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
