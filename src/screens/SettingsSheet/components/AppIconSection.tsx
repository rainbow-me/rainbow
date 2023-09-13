import React, { useCallback, useMemo } from 'react';
import { Source } from 'react-native-fast-image';
import { MMKV } from 'react-native-mmkv';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import AppIconFiniliar from '@/assets/appIconFiniliar.png';
import AppIconGoldDoge from '@/assets/appIconGoldDoge.png';
import AppIconRainDoge from '@/assets/appIconRainDoge.png';
import AppIconOg from '@/assets/appIconOg.png';
import AppIconOptimism from '@/assets/appIconOptimism.png';
import AppIconPixel from '@/assets/appIconPixel.png';
import AppIconPooly from '@/assets/appIconPooly.png';
import AppIconSmol from '@/assets/appIconSmol.png';
import AppIconZora from '@/assets/appIconZora.png';
import AppIconZorb from '@/assets/appIconZorb.png';
import AppIconPoolboy from '@/assets/appIconPoolboy.png';
import AppIconAdworld from '@/assets/appIconAdworld.png';
import { Box } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { ImgixImage } from '@/components/images';
import { useTheme } from '@/theme';
import Logger from '@/utils/logger';
import {
  AdworldIcon,
  FiniliarIcon,
  GoldDogeIcon,
  OptimismIcon,
  PoolboyIcon,
  PoolyIcon,
  RainDogeIcon,
  SmolIcon,
  ZoraIcon,
  ZorbIcon,
} from '@/featuresToUnlock/unlockableAppIcons';
import { analytics } from '@/analytics';
import { ImageSourcePropType } from 'react-native';

type AppIcon = {
  accentColor?: string;
  key: string;
  name: string;
  source: ImageSourcePropType;
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

export const tokenGatedIcons: { [key: string]: LockedAppIcon } = {
  optimism: {
    accentColor: 'optimismRed',
    key: OptimismIcon.key,
    name: 'Optimism',
    source: AppIconOptimism,
    unlock_key: OptimismIcon.unlockKey,
  },
  smol: {
    accentColor: 'smolPurple',
    key: SmolIcon.key,
    name: 'SMOL',
    source: AppIconSmol,
    unlock_key: SmolIcon.unlockKey,
  },
  zora: {
    accentColor: 'rainbowBlue',
    key: ZoraIcon.key,
    name: 'Zora',
    source: AppIconZora,
    unlock_key: ZoraIcon.unlockKey,
  },
  golddoge: {
    accentColor: 'dogeGold',
    key: GoldDogeIcon.key,
    name: 'GOLDDOGE',
    source: AppIconGoldDoge,
    unlock_key: GoldDogeIcon.unlockKey,
  },
  raindoge: {
    accentColor: 'dogeGold',
    key: RainDogeIcon.key,
    name: 'RAINDOGE',
    source: AppIconRainDoge,
    unlock_key: RainDogeIcon.unlockKey,
  },
  pooly: {
    accentColor: 'poolyPurple',
    key: PoolyIcon.key,
    name: 'Rainbow Pooly',
    source: AppIconPooly,
    unlock_key: PoolyIcon.unlockKey,
  },
  finiliar: {
    accentColor: 'finiliarPink',
    key: FiniliarIcon.key,
    name: 'Rainbow Finiliar',
    source: AppIconFiniliar,
    unlock_key: FiniliarIcon.unlockKey,
  },
  zorb: {
    accentColor: 'zorbPink',
    key: ZorbIcon.key,
    name: 'Rainbow Zorb Energy',
    source: AppIconZorb,
    unlock_key: ZorbIcon.unlockKey,
  },
  poolboy: {
    accentColor: 'poolboyPink',
    key: PoolboyIcon.key,
    name: 'Rainbow Poolboy',
    source: AppIconPoolboy,
    unlock_key: PoolboyIcon.unlockKey,
  },
  adworld: {
    accentColor: 'adworldRed',
    key: AdworldIcon.key,
    name: 'Rainbow World',
    source: AppIconAdworld,
    unlock_key: AdworldIcon.unlockKey,
  },
};

const mmkv = new MMKV();

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
                      borderRadius: 8,
                    }}
                    size={30}
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
