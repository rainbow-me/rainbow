import React, { useCallback } from 'react';
import { MMKV } from 'react-native-mmkv';
import { RadioList, RadioListItem } from '../radio-list';
import { UNLOCK_KEY_OPTIMISM_NFT_APP_ICON } from '@/featuresToUnlock';
import AppIconOg from '@rainbow-me/assets/appIconOg.png';
import AppIconOptimism from '@rainbow-me/assets/appIconOptimism.png';
import AppIconPixel from '@rainbow-me/assets/appIconPixel.png';
import { Box } from '@rainbow-me/design-system';
import { useAccountSettings } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import Logger from '@rainbow-me/utils/logger';

const supportedAppIcons = {
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

const tokenGatedIcons = {
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

const AppIconListItem = ({ name, value, source, color, ...item }) => {
  const { colors, isDarkMode } = useTheme();
  return (
    <RadioListItem
      {...item}
      icon={
        <Box
          style={{
            shadowColor: isDarkMode
              ? colors.shadowBlack
              : colors[color] || colors.shadowBlack,
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
      label={name}
      value={value}
    />
  );
};

const mmkv = new MMKV();

const AppIconSection = () => {
  const { appIcon, settingsChangeAppIcon } = useAccountSettings();

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
    <RadioList
      items={appIconListItemsWithUnlocked}
      marginTop={7}
      onChange={onSelectIcon}
      renderItem={AppIconListItem}
      value={appIcon}
    />
  );
};

export default AppIconSection;
