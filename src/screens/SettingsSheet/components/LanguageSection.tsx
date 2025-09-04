import React, { useCallback } from 'react';
import { Language, resources, supportedLanguages } from '../../../languages';
import { useLanguage } from '../../../languages/LanguageContext';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import { analytics } from '@/analytics';

const languageListItems = Object.keys(supportedLanguages)
  .filter(code => resources[code as keyof typeof resources]?.translation?.wallet) // Only show languages that have 'wallet' translations available.
  .map(code => ({
    code,
    name: (supportedLanguages as any)[code].label,
  }));

const LanguageSection = () => {
  const { language, setLanguage } = useLanguage();

  const onSelectLanguage = useCallback(
    (language: string) => {
      setLanguage(language as Language);
      analytics.track(analytics.event.changedLanguage, { language });
    },
    [setLanguage]
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
