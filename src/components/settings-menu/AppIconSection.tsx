import React, { useCallback, useMemo } from 'react';
import { Source } from 'react-native-fast-image';
import { MMKV } from 'react-native-mmkv';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import { OptimismIcon, SmolIcon } from '@/featuresToUnlock/unlockableAppIcons';
import AppIconOg from '@rainbow-me/assets/appIconOg.png';
import AppIconOptimism from '@rainbow-me/assets/appIconOptimism.png';
import AppIconPixel from '@rainbow-me/assets/appIconPixel.png';
import AppIconSmol from '@rainbow-me/assets/appIconSmol.png';
import { Box } from '@rainbow-me/design-system';
import { useAccountSettings } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { useTheme } from '@rainbow-me/theme';
import Logger from '@rainbow-me/utils/logger';

type AppIcon = {
  accentColor?: string;
  key: string;
  name: string;
  source: StaticImageData;
};

const supportedAppIcons: { [key: string]: AppIcon } = {
  og: {
    accentColor: 'rainbowBlue',
    key: 'og',
    name: 'OG',
    source: AppIconOg,
  },
  pixel: {
    accentColor: 'rainbowBlue',
    key: 'pixel',
    name: 'Pixel',
    source: AppIconPixel,
  },
};

type LockedAppIcon = AppIcon & {
  unlock_key: string;
};

const tokenGatedIcons: { [key: string]: LockedAppIcon } = {
  optimism: {
    accentColor: 'optimismRed',
    key: 'optimism',
    name: 'Optimism',
    source: AppIconOptimism,
    unlock_key: OptimismIcon.unlockKey,
  },
  smol: {
    accentColor: 'smolPurple',
    key: 'smol',
    name: 'SMOL',
    source: AppIconSmol,
    unlock_key: SmolIcon.unlockKey,
  },
};

const mmkv = new MMKV();

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

  return (
    <MenuContainer>
      <Menu>
        {appIconListItemsWithUnlocked.map(
          ({ key, name, accentColor, source }) => (
            <MenuItem
              key={key}
              leftComponent={
                <Box
                  style={{
                    shadowColor: isDarkMode
                      ? colors.shadowBlack
                      : (accentColor && (colors as any)[accentColor]) ||
                        colors.shadowBlack,
                    shadowOffset: { height: 4, width: 0 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                  }}
                >
                  <ImgixImage
                    source={source as Source}
                    style={{
                      height: 36,
                      width: 36,
                    }}
                  />
                </Box>
              }
              onPress={() => onSelectIcon(key)}
              rightComponent={
                key === appIcon && <MenuItem.StatusIcon status="selected" />
              }
              size={60}
              titleComponent={<MenuItem.Title text={name} />}
            />
          )
        )}
      </Menu>
    </MenuContainer>
  );
};

export default AppIconSection;
