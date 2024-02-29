import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { useNavigation } from '@/navigation';
import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { AccentColorProvider, Box, Inset, Stack, Text, useBackgroundColor } from '@/design-system';
import { UnlockableAppIcon, unlockableAppIcons } from '@/appIcons/appIcons';
import { ImgixImage } from '@/components/images';
import { Source } from 'react-native-fast-image';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useTheme } from '@/theme';
import * as i18n from '@/languages';
import { delay } from '@/utils/delay';
import Routes from '@/navigation/routesNames';
import { SheetActionButton } from '@/components/sheet';
import { campaigns } from '@/storage';
import { analytics } from '@/analytics';

const APP_ICON_SIZE = 64;

type AppIconUnlockSheetParams = {
  [Routes.APP_ICON_UNLOCK_SHEET]: {
    appIconKey: keyof typeof unlockableAppIcons;
  };
};

export default function AppIconUnlockSheet() {
  const { params } = useRoute<RouteProp<AppIconUnlockSheetParams, 'AppIconUnlockSheet'>>();
  const { goBack, navigate, setParams } = useNavigation();
  const { colors } = useTheme();

  const { appIconKey } = params;

  const { accentColor, image } = unlockableAppIcons[appIconKey as keyof typeof unlockableAppIcons] as UnlockableAppIcon;

  const navigateToAppIconSettings = useCallback(async () => {
    goBack();
    navigate(Routes.SETTINGS_SHEET);
    await delay(500);
    navigate(Routes.SETTINGS_SHEET, { screen: 'AppIconSection' });
    analytics.track('Activated App Icon Unlock', { campaign: appIconKey });
  }, [appIconKey, goBack, navigate]);

  useEffect(() => {
    analytics.track('Viewed App Icon Unlock', { campaign: appIconKey });
    return () => {
      campaigns.set(['isCurrentlyShown'], false);
      analytics.track('Dismissed App Icon Unlock', { campaign: appIconKey });
    };
  }, [appIconKey]);

  return (
    <SimpleSheet backgroundColor={useBackgroundColor('surfacePrimary')}>
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
                  {/* @ts-ignore */}
                  {i18n.t(i18n.l.app_icon_unlock_sheet[`${appIconKey}_title`])}
                </Text>
                <Text size="18px / 27px (Deprecated)" weight="regular" color="labelTertiary" align="center">
                  {/* @ts-ignore */}
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
