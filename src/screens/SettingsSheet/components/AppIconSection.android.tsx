import * as i18n from '@/languages';
import React, { useCallback, useMemo } from 'react';
import { Source } from 'react-native-fast-image';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import { BackgroundProvider, Box, Inline, Inset, Text } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { ImgixImage } from '@/components/images';
import { useTheme } from '@/theme';
import Logger from '@/utils/logger';
import { analytics } from '@/analytics';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { AppIcon, freeAppIcons, unlockableAppIconStorage, unlockableAppIcons } from '@/appIcons/constants';

const AppIconSection = () => {
  const { appIcon, settingsChangeAppIcon } = useAccountSettings();
  const { colors, isDarkMode } = useTheme();

  const onSelectIcon = useCallback(
    (icon: string) => {
      Logger.log('onSelectIcon', icon);
      analytics.track('Set App Icon', { appIcon: icon });
      settingsChangeAppIcon(icon);
    },
    [settingsChangeAppIcon]
  );

  const unlockedAppIcons = useMemo(
    () => ({
      ...freeAppIcons,
      ...Object.keys(unlockableAppIcons).reduce(
        (unlockedAppIcons, appIconKey) => {
          const appIcon = unlockableAppIcons[appIconKey];
          const unlocked = unlockableAppIconStorage.getBoolean(appIconKey);
          Logger.log('checking if unlocked', appIcon.displayName, unlocked, appIconKey);
          if (unlocked) {
            Logger.log('unlocked', appIcon.displayName);
            unlockedAppIcons[appIconKey] = appIcon;
          }
          return unlockedAppIcons;
        },
        {} as { [key: string]: AppIcon }
      ),
    }),
    []
  );

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet backgroundColor={backgroundColor as string}>
          <Inset top="20px" horizontal="20px" bottom="60px">
            <Inline alignHorizontal="center" alignVertical="center">
              <Box paddingBottom="12px">
                <Text size="22pt" weight="heavy" color="label">
                  {i18n.t(i18n.l.settings.app_icon)}
                </Text>
              </Box>
            </Inline>
            <MenuContainer>
              <Menu>
                {Object.entries(unlockedAppIcons).map(([key, { displayName, image, accentColor }]) => (
                  <MenuItem
                    key={key}
                    leftComponent={
                      <Box
                        style={{
                          shadowColor: isDarkMode
                            ? colors.shadowBlack
                            : (accentColor && (colors as any)[accentColor]) || colors.shadowBlack,
                          shadowOffset: { height: 4, width: 0 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                        }}
                      >
                        <ImgixImage
                          source={image as Source}
                          style={{
                            height: 36,
                            width: 36,
                            borderRadius: 8,
                          }}
                          size={30}
                        />
                      </Box>
                    }
                    onPress={() => onSelectIcon(key)}
                    rightComponent={key === appIcon && <MenuItem.StatusIcon status="selected" />}
                    size={60}
                    titleComponent={<MenuItem.Title text={displayName} />}
                  />
                ))}
              </Menu>
            </MenuContainer>
          </Inset>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
};

export default AppIconSection;
