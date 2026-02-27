import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { useNavigation } from '@/navigation';
import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { AccentColorProvider, Box, Inset, Stack, Text, useBackgroundColor } from '@/design-system';
import { unlockableAppIcons } from '../models/appIcons';
import { ImgixImage } from '@/components/images';
import { type Source } from 'react-native-fast-image';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { useTheme } from '@/theme';
import * as i18n from '@/languages';
import { delay } from '@/utils/delay';
import Routes from '@/navigation/routesNames';
import { SheetActionButton } from '@/components/sheet';
import { analytics } from '@/analytics';
import { SettingsPages } from '@/screens/SettingsSheet/SettingsPages';
import { type RootStackParamList } from '@/navigation/types';
import { opacity } from '@/framework/ui/utils/opacity';

const APP_ICON_SIZE = 64;

export default function AppIconUnlockSheet() {
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.APP_ICON_UNLOCK_SHEET>>();
  const { goBack, navigate, setParams } = useNavigation<typeof Routes.APP_ICON_UNLOCK_SHEET>();
  const { colors } = useTheme();

  const { appIconKey } = params;

  const { accentColor, image } = unlockableAppIcons[appIconKey];

  const navigateToAppIconSettings = useCallback(async () => {
    goBack();
    navigate(Routes.SETTINGS_SHEET);
    await delay(500);
    navigate(Routes.SETTINGS_SHEET, { screen: SettingsPages.appIcon.key });
    analytics.track(analytics.event.appIconUnlockSheetCTAPressed, { appIcon: appIconKey });
  }, [appIconKey, goBack, navigate]);

  useEffect(() => {
    analytics.track(analytics.event.appIconUnlockSheetViewed, { appIcon: appIconKey });
  }, [appIconKey]);

  return (
    <SimpleSheet backgroundColor={useBackgroundColor('surfacePrimary')} scrollEnabled={false}>
      <View onLayout={e => setParams({ longFormHeight: e.nativeEvent.layout.height })}>
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
              color={opacity(accentColor, 0.06)}
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
