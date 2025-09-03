import React, { useCallback } from 'react';
import { resources, supportedLanguages } from '../../../languages';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import { analytics } from '@/analytics';
import { pickBy } from '@/helpers/utilities';
import { useAccountSettings } from '@/hooks';

const languageListItems = Object.keys(supportedLanguages)
  .filter(code => resources[code as keyof typeof resources]?.translation?.wallet) // Only show languages that have 'wallet' translations available.
  .map(code => ({
    code,
    name: (supportedLanguages as any)[code].label,
  }));

const LanguageSection = () => {
  const { language, settingsChangeLanguage } = useAccountSettings();

  const onSelectLanguage = useCallback(
    (language: string) => {
      settingsChangeLanguage(language);
      analytics.track(analytics.event.changedLanguage, { language });
    },
    [settingsChangeLanguage]
  );

  return (
    <MenuContainer>
      <Menu>
        {languageListItems.map(({ name, code }: any) => (
          <MenuItem
            key={code}
            onPress={() => onSelectLanguage(code)}
            rightComponent={code === language && <MenuItem.StatusIcon status="selected" />}
            size={52}
            titleComponent={<MenuItem.Title text={name} />}
          />
        ))}
      </Menu>
    </MenuContainer>
  );
};

export default LanguageSection;
