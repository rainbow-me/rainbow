import React, { useCallback } from 'react';
import { RadioList, RadioListItem } from '../radio-list';
import AppIconJoy from '@rainbow-me/assets/app-icon-joy.png';
import AppIconOg from '@rainbow-me/assets/app-icon-og.png';
import RainbowIcon from '@rainbow-me/assets/rainbowIcon.png';
import { Box } from '@rainbow-me/design-system';
import { useAccountSettings } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import Logger from '@rainbow-me/utils/logger';

const supportedAppIcons = {
  og: {
    name: 'The OG',
    source: RainbowIcon,
    value: 'og',
  },
  // eslint-disable-next-line sort-keys-fix/sort-keys-fix
  joy: {
    name: 'Joy Inspired',
    source: RainbowIcon,
    value: 'joy',
  },
};
const appIconListItems = Object.values(supportedAppIcons).map(
  ({ icon, ...item }) => ({
    ...item,
    key: icon,
  })
);

const AppIconListItem = ({ name, value, source, ...item }) => (
  <RadioListItem
    {...item}
    icon={
      <Box
        as={ImgixImage}
        height={{ custom: 36 }}
        source={source}
        width={{ custom: 36 }}
      />
    }
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
