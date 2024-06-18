import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { useNavigation } from '@/navigation';
import React, { useCallback, useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import { AccentColorProvider, Box, Inset, Stack, Text, useBackgroundColor } from '@/design-system';
import { UnlockableAppIconKey, unlockableAppIcons } from '@/appIcons/appIcons';
import { ImgixImage } from '@/components/images';
import { Source } from 'react-native-fast-image';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useTheme } from '@/theme';
import * as i18n from '@/languages';
import { delay } from '@/utils/delay';
import Routes from '@/navigation/routesNames';
import { SheetActionButton } from '@/components/sheet';
import { analyticsV2 } from '@/analytics';
import { remotePromoSheetsStore } from '@/state/remotePromoSheets/remotePromoSheets';
import { IS_ANDROID } from '@/env';

const APP_ICON_SIZE = 64;

type AppIconUnlockSheetParams = {
  [Routes.APP_ICON_UNLOCK_SHEET]: {
    appIconKey: UnlockableAppIconKey;
  };
};

export default function AppIconUnlockSheet() {
  const { params } = useRoute<RouteProp<AppIconUnlockSheetParams, 'AppIconUnlockSheet'>>();
  const { goBack, navigate, setParams } = useNavigation();
  const { colors } = useTheme();

  const { appIconKey } = params;

  const { accentColor, image } = unlockableAppIcons[appIconKey];

  const navigateToAppIconSettings = useCallback(async () => {
    goBack();
    navigate(Routes.SETTINGS_SHEET);
    await delay(500);
    navigate(Routes.SETTINGS_SHEET, { screen: 'AppIconSection' });
    analyticsV2.track(analyticsV2.event.appIconUnlockSheetCTAPressed, { appIcon: appIconKey });
  }, [appIconKey, goBack, navigate]);

  useEffect(() => {
    analyticsV2.track(analyticsV2.event.appIconUnlockSheetViewed, { appIcon: appIconKey });
    return () => {
      remotePromoSheetsStore.setState({ isShown: false });
    };
  }, [appIconKey]);

  return (
    <SimpleSheet backgroundColor={useBackgroundColor('surfacePrimary')} scrollEnabled={false}>
      <View onLayout={e => setParams({ longFormHeight: e.nativeEvent.layout.height + (IS_ANDROID ? StatusBar.currentHeight ?? 0 : 0) })}>
        <Inset top="36px" bottom="20px" horizontal="20px">
          <Stack space="36px">
            <Inset horizontal="20px">
              <Stack space="24px" alignHorizontal="center">
                <AccentColorProvider color={accentColor}>
                  <Box
                    as={ImgixImage}
                    source={image as Source}
                    size={APP_ICON_SIZE}
                    background="surfacePrimary"
                    width={{ custom: APP_ICON_SIZE }}
                    height={{ custom: APP_ICON_SIZE }}
                    shadow="18px accent"
                    borderRadius={14}
                  />
                </AccentColorProvider>
                <Text size="22pt" weight="heavy" color="label" align="center">
                  {i18n.t(i18n.l.app_icon_unlock_sheet[`${appIconKey}_title`])}
                </Text>
                <Text size="18px / 27px (Deprecated)" weight="regular" color="labelTertiary" align="center">
                  {i18n.t(i18n.l.app_icon_unlock_sheet[`${appIconKey}_description`])}
                </Text>
              </Stack>
            </Inset>
            <SheetActionButton
              color={colors.alpha(accentColor, 0.06)}
              isTransparent
              label={i18n.t(i18n.l.app_icon_unlock_sheet.button)}
              onPress={navigateToAppIconSettings}
              size="big"
              textColor={accentColor}
              weight="heavy"
            />
          </Stack>
        </Inset>
      </View>
    </SimpleSheet>
  );
}
