import React, { useCallback } from 'react';
import { ButtonPressAnimation } from '../animations';
import { RadioList, RadioListItem } from '../radio-list';
import AppIconJoy from '@rainbow-me/assets/app-icon-joy.png';
import AppIconOg from '@rainbow-me/assets/app-icon-og.png';
import { Stack, Text } from '@rainbow-me/design-system';
import { useAccountSettings } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import Logger from '@rainbow-me/utils/logger';

const supportedAppIcons = {
  joy: {
    icon: 'joy',
    name: 'Joy Inspired',
    source: AppIconOg,
    value: 'joy',
  },
  og: {
    icon: 'og',
    name: 'The OG',
    source: AppIconJoy,
    value: 'og',
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
  const { navigate } = useNavigation();

  const onSelectIcon = useCallback(
    icon => {
      Logger.log('onSelectIcon', icon);
      settingsChangeAppIcon(icon);
    },
    [settingsChangeAppIcon]
  );

  const onPressExplainer = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      type: 'app_icon',
    });
  }, [navigate]);

  return (
    <Stack space="10px">
      <RadioList
        items={appIconListItems}
        marginTop={7}
        onChange={onSelectIcon}
        renderItem={AppIconListItem}
        value={appIcon}
      />
      <ButtonPressAnimation onPress={onPressExplainer} scale={0.96}>
        <Text align="center" color="secondary60" weight="semibold">
          􀅵 Explainer
        </Text>
      </ButtonPressAnimation>
    </Stack>
  );
};

export default AppIconSection;
