import React, { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';

import { analytics } from '@/analytics';
import { ImgixImage } from '@/components/images';
import { Box } from '@/design-system';
import { appSettingsActions, useAppSettingsStore } from '@/features/settings/data/appSettingsStore';
import { WrappedAlert as Alert } from '@/helpers/alert';
import * as i18n from '@/languages';
import { logger } from '@/logger';
import { Menu } from '@/screens/SettingsSheet/components/Menu';
import { MenuContainer } from '@/screens/SettingsSheet/components/MenuContainer';
import { MenuItem } from '@/screens/SettingsSheet/components/MenuItem';
import { useTheme } from '@/theme/ThemeContext';

import {
  freeAppIconKeys,
  freeAppIcons,
  unlockableAppIconKeys,
  unlockableAppIcons,
  type AppIcon,
  type AppIconKey,
} from '../models/appIcons';
import { unlockableAppIconStorage } from '../utils/unlockableAppIconCheck';

export const AppIconSettingsSection = () => {
  const appIcon = useAppSettingsStore(s => s.appIcon);
  const { colors, isDarkMode } = useTheme();

  const onSelectIcon = useCallback((icon: AppIconKey) => {
    logger.debug(`[AppIconSection]: onSelectIcon: ${icon}`);
    analytics.track(analytics.event.setAppIcon, { appIcon: icon });

    if (Platform.OS === 'android') {
      Alert.alert(i18n.t(i18n.l.settings.icon_change.title), i18n.t(i18n.l.settings.icon_change.warning), [
        { text: i18n.t(i18n.l.settings.icon_change.cancel) },
        {
          text: i18n.t(i18n.l.settings.icon_change.confirm),
          onPress: () => appSettingsActions.setAppIcon(icon),
        },
      ]);
    } else {
      appSettingsActions.setAppIcon(icon);
    }
  }, []);

  const unlockedAppIcons = useMemo(() => {
    const icons: [AppIconKey, AppIcon][] = freeAppIconKeys.map(key => [key, freeAppIcons[key]]);

    for (const appIconKey of unlockableAppIconKeys) {
      const appIcon = unlockableAppIcons[appIconKey];
      const unlocked = unlockableAppIconStorage.getBoolean(appIconKey);
      logger.debug(`[AppIconSection]: checking if unlocked ${appIcon.displayName} ${unlocked} ${appIconKey}`);
      if (unlocked) {
        logger.debug(`[AppIconSection]: unlocked ${appIcon.displayName}`);
        icons.push([appIconKey, appIcon]);
      }
    }

    return icons;
  }, []);

  return (
    <MenuContainer>
      <Menu>
        {unlockedAppIcons.map(([key, { displayName, image, accentColor }]) => (
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
                  source={image}
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
