import React, { useCallback, useMemo } from 'react';
import { Source } from 'react-native-fast-image';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import { Box } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { ImgixImage } from '@/components/images';
import { useTheme } from '@/theme';
import Logger from '@/utils/logger';
import { analytics } from '@/analytics';
import { AppIcon, AppIconKey, UnlockableAppIcon, UnlockableAppIconKey, freeAppIcons, unlockableAppIcons } from '@/appIcons/appIcons';
import { unlockableAppIconStorage } from '@/featuresToUnlock/unlockableAppIconCheck';

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

  const unlockedAppIcons: Record<AppIconKey, AppIcon> = useMemo(
    () => ({
      ...freeAppIcons,
      ...(Object.keys(unlockableAppIcons) as UnlockableAppIconKey[]).reduce(
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
        {} as Record<UnlockableAppIconKey, UnlockableAppIcon>
      ),
    }),
    []
  );

  return (
    <MenuContainer>
      <Menu>
        {Object.entries(unlockedAppIcons).map(([key, { displayName, image, accentColor }]) => (
          <MenuItem
            key={key}
            leftComponent={
              <Box
                style={{
                  shadowColor: isDarkMode ? colors.shadowBlack : (accentColor && (colors as any)[accentColor]) || colors.shadowBlack,
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
  );
};

export default AppIconSection;
