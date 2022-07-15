import analytics from '@segment/analytics-react-native';
import React, { useCallback } from 'react';
import { resources, supportedLanguages } from '../../languages';
import { pickBy } from '@rainbow-me/helpers/utilities';
import { useAccountSettings } from '@rainbow-me/hooks';
import MenuContainer from './components/MenuContainer';
import Menu from './components/Menu';
import MenuItem from './components/MenuItem';

const languagesWithWalletTranslations = Object.keys(
  pickBy(resources, language => language?.translation?.wallet) // Only show languages that have 'wallet' translations available.
);

const languageListItems = languagesWithWalletTranslations.map(code => ({
  code,
  name: (supportedLanguages as any)[code],
}));

const LanguageSection = () => {
  const { language, settingsChangeLanguage } = useAccountSettings();

  const onSelectLanguage = useCallback(
    language => {
      settingsChangeLanguage(language);
      analytics.track('Changed language', { language });
    },
    [settingsChangeLanguage]
  );

  return (
    <MenuContainer>
      <Menu>
        {languageListItems.map(({ name, code }: any) => {
          return (
            <MenuItem
              onPress={() => onSelectLanguage(code)}
              rightComponent={
                code === language && <MenuItem.StatusIcon status="selected" />
              }
              titleComponent={<MenuItem.Title text={name} />}
              iconPadding="large"
              size="medium"
            />
          );
        })}
      </Menu>
    </MenuContainer>
  );
};

export default LanguageSection;
