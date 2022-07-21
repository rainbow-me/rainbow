import React, { useCallback } from 'react';
import { MMKV } from 'react-native-mmkv';
import { RadioList, RadioListItem } from '../radio-list';
import { UNLOCK_KEY_OPTIMISM_NFT_APP_ICON } from '@/featuresToUnlock';
import AppIconOg from '@rainbow-me/assets/app-icon-og.png';
import AppIconOptimism from '@rainbow-me/assets/app-icon-optimism.png';
import AppIconPixel from '@rainbow-me/assets/app-icon-pixel.png';
import { useAccountSettings } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import Logger from '@rainbow-me/utils/logger';

const supportedAppIcons = {
  og: {
    icon: 'og',
    key: 'og',
    name: 'The OG',
    source: AppIconOg,
    value: 'og',
  },
  pixel: {
    icon: 'pixel',
    key: 'pixel',
    name: 'Pixel',
    source: AppIconPixel,
    value: 'pixel',
  },
};

const tokenGatedIcons = {
  optimism: {
    icon: 'optimism',
    key: 'optimism',
    name: 'Optimism x Rainbow',
    source: AppIconOptimism,
    unlock_key: UNLOCK_KEY_OPTIMISM_NFT_APP_ICON,
    value: 'optimism',
  },
};

const AppIconListItem = ({ name, value, source, ...item }) => (
  <RadioListItem
    {...item}
    icon={<ImgixImage source={source} style={{ height: 36, width: 36 }} />}
    label={name}
    value={value}
  />
);

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
    const mmkv = new MMKV();
    Object.keys(tokenGatedIcons).forEach(key => {
      const icon = tokenGatedIcons[key];
      if (mmkv.getBoolean(icon.unlock_key)) {
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
