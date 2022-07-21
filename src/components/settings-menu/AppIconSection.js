import React, { useCallback } from 'react';
import { RadioList, RadioListItem } from '../radio-list';
import AppIconOg from '@rainbow-me/assets/app-icon-og.png';
import AppIconOptimism from '@rainbow-me/assets/app-icon-optimism.png';
import AppIconPixel from '@rainbow-me/assets/app-icon-pixel.png';
import { useAccountSettings } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import Logger from '@rainbow-me/utils/logger';

const supportedAppIcons = {
  og: {
    icon: 'og',
    name: 'The OG',
    source: AppIconOg,
    value: 'og',
  },
  optimism: {
    icon: 'optimism',
    name: 'Optimism x Rainbow',
    source: AppIconOptimism,
    value: 'optimism',
  },
  pixel: {
    icon: 'pixel',
    name: 'Pixel',
    source: AppIconPixel,
    value: 'pixel',
  },
};
const appIconListItems = Object.values(supportedAppIcons).map(
  ({ icon, ...item }) => ({
    ...item,
    key: icon,
  })
);

const renderAppIcon = appIcon => {
  if (!appIcon) return null;
  const { source } = supportedAppIcons[appIcon].source;
  return <ImgixImage height="128" source={source} width="128" />;
};

const AppIconListItem = ({ icon, name, value, ...item }) => (
  <RadioListItem
    {...item}
    icon={renderAppIcon(icon)}
    label={`${name}`}
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

  return (
    <RadioList
      items={appIconListItems}
      marginTop={7}
      onChange={onSelectIcon}
      renderItem={AppIconListItem}
      value={appIcon}
    />
  );
};

export default AppIconSection;
