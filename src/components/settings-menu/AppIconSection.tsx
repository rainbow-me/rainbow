import React, { useCallback, useMemo } from 'react';
import { MMKV } from 'react-native-mmkv';
import Menu from './components/Menu';
import MenuItem from './components/MenuItem';
import { UNLOCK_KEY_OPTIMISM_NFT_APP_ICON } from '@/featuresToUnlock';
import AppIconOg from '@rainbow-me/assets/appIconOg.png';
import AppIconOptimism from '@rainbow-me/assets/appIconOptimism.png';
import AppIconPixel from '@rainbow-me/assets/appIconPixel.png';
import { Box } from '@rainbow-me/design-system';
import { useAccountSettings } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { useTheme } from '@rainbow-me/theme';
import Logger from '@rainbow-me/utils/logger';

type AppIcon = {
  color: string;
  icon: string;
  key: string;
  name: string;
  source: StaticImageData;
  value: string;
  unlock_key?: string;
};

const supportedAppIcons: { [key: string]: AppIcon } = {
  og: {
    color: 'rainbowBlue',
    icon: 'og',
    key: 'og',
    name: 'OG',
    source: AppIconOg,
    value: 'og',
  },
  pixel: {
    color: 'rainbowBlue',
    icon: 'pixel',
    key: 'pixel',
    name: 'Pixel',
    source: AppIconPixel,
    value: 'pixel',
  },
};

type LockedAppIcon = AppIcon & {
  unlock_key: string;
};

const tokenGatedIcons: { [key: string]: LockedAppIcon } = {
  optimism: {
    color: 'optimismRed',
    icon: 'optimism',
    key: 'optimism',
    name: 'Optimism',
    source: AppIconOptimism,
    unlock_key: UNLOCK_KEY_OPTIMISM_NFT_APP_ICON,
    value: 'optimism',
  },
};

const AppIconSection = () => {
  const { appIcon, settingsChangeAppIcon } = useAccountSettings();
  const { colors, isDarkMode } = useTheme();

  const onSelectIcon = useCallback(
    icon => {
      Logger.log('onSelectIcon', icon);
      settingsChangeAppIcon(icon);
    },
    [settingsChangeAppIcon]
  );

  const appIconListItemsWithUnlocked = useMemo(() => {
    // Here we gotta check if each additional icon is unlocked and add it to the list
    const list = supportedAppIcons;
    const mmkv = new MMKV();
    Object.keys(tokenGatedIcons).forEach(key => {
      const icon = tokenGatedIcons[key];
      const unlocked = mmkv.getBoolean(icon.unlock_key);
      Logger.log('checking if unlocked', icon.name, unlocked, icon.unlock_key);
      if (unlocked) {
        Logger.log('unlocked', icon.name);
        list[key] = icon;
      }
    });
    return Object.values(list);
  }, []);

  const AppIconList = () => (
    <>
      {appIconListItemsWithUnlocked.map(
        ({ icon, source, name, color, key }: any) => {
          return (
            <MenuItem
              key={key}
              leftComponent={
                <Box
                  style={{
                    shadowColor: isDarkMode
                      ? colors.shadowBlack
                      : (colors as any)[color] || colors.shadowBlack,
                    shadowOffset: { height: 4, width: 0 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                  }}
                >
                  <ImgixImage
                    source={source}
                    style={{
                      height: 36,
                      width: 36,
                    }}
                  />
                </Box>
              }
              onPress={() => onSelectIcon(icon)}
              rightComponent={
                icon === appIcon && <MenuItem.StatusIcon status="selected" />
              }
              size={52}
              titleComponent={<MenuItem.Title text={name} />}
            />
          );
        }
      )}
    </>
  );

  return (
    <Menu>
      <AppIconList />
    </Menu>
  );
};

export default AppIconSection;
