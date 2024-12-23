import React, { useCallback, useMemo, useState } from 'react';
import { Source } from 'react-native-fast-image';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import { Box } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { ImgixImage } from '@/components/images';
import { useTheme } from '@/theme';
import { logger } from '@/logger';
import { analytics } from '@/analytics';
import { AppIcon, AppIconKey, UnlockableAppIcon, UnlockableAppIconKey, freeAppIcons, unlockableAppIcons } from '@/appIcons/appIcons';
import { unlockableAppIconStorage } from '@/featuresToUnlock/unlockableAppIconCheck';
import UnlockToast from '@/components/toasts/appIconToast';

type UnlockStatusMap = { [key in AppIconKey | UnlockableAppIconKey]: boolean };

const AppIconSection = () => {
  const { appIcon, settingsChangeAppIcon } = useAccountSettings();
  const { colors, isDarkMode } = useTheme();

  const [showUnlockMessage, setShowUnlockMessage] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  const onSelectIcon = useCallback(
    (icon: string, isUnlocked: boolean) => {
      if (!isUnlocked) {
        setShowUnlockMessage(true);
        setMessageCount(count => count + 1);
        return;
      }

      logger.debug(`[AppIconSection]: onSelectIcon: ${icon}`);
      analytics.track('Set App Icon', { appIcon: icon });
      settingsChangeAppIcon(icon);
    },
    [settingsChangeAppIcon]
  );

  // Get mapping of which icons are unlocked
  const unlockedStatus: UnlockStatusMap = useMemo(() => {
    const freeIconsStatus = Object.keys(freeAppIcons).reduce<Partial<UnlockStatusMap>>(
      (acc, key) => ({
        ...acc,
        [key as AppIconKey]: true,
      }),
      {}
    );

    const unlockableIconsStatus = (Object.keys(unlockableAppIcons) as UnlockableAppIconKey[]).reduce<Partial<UnlockStatusMap>>(
      (acc, appIconKey) => ({
        ...acc,
        [appIconKey]: unlockableAppIconStorage.getBoolean(appIconKey),
      }),
      {}
    );

    return {
      ...freeIconsStatus,
      ...unlockableIconsStatus,
    } as UnlockStatusMap;
  }, []);

  // Combine all icons into one object
  const allAppIcons: Record<AppIconKey | UnlockableAppIconKey, AppIcon | UnlockableAppIcon> = useMemo(
    () => ({
      ...freeAppIcons,
      ...unlockableAppIcons,
    }),
    []
  );

  console.log('showUnlockMessage', showUnlockMessage);
  console.log('messageCount', messageCount);

  return (
    <>
      <UnlockToast />
      <MenuContainer>
        <Menu>
          {Object.entries(allAppIcons).map(([key, { displayName, image, accentColor }]) => {
            const isUnlocked = unlockedStatus[key as AppIconKey | UnlockableAppIconKey];

            return (
              <MenuItem
                key={key}
                leftComponent={
                  <Box
                    style={{
                      shadowColor: isDarkMode ? colors.shadowBlack : (accentColor && (colors as any)[accentColor]) || colors.shadowBlack,
                      shadowOffset: { height: 4, width: 0 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      opacity: isUnlocked ? 1 : 0.2,
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
                onPress={() => onSelectIcon(key, isUnlocked)}
                rightComponent={key === appIcon && isUnlocked && <MenuItem.StatusIcon status="selected" />}
                size={60}
                titleComponent={<MenuItem.Title text={displayName} />}
              />
            );
          })}
        </Menu>
      </MenuContainer>
    </>
  );
};

export default AppIconSection;
