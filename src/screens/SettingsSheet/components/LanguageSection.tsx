import React, { useCallback } from 'react';

import { analytics } from '@/analytics';
import { appSettingsActions, useAppSettingsStore } from '@/features/settings/data/appSettingsStore';
import { type Language } from '@/languages/types';

import { supportedLanguages } from '../../../languages';
import { Menu } from './Menu';
import { MenuContainer } from './MenuContainer';
import { MenuItem } from './MenuItem';

export const LanguageSection = () => {
  const language = useAppSettingsStore(s => s.language);

  const onSelectLanguage = useCallback((language: Language) => {
    appSettingsActions.setLanguage(language);
    analytics.identify({ language });
    analytics.track(analytics.event.changedLanguage, { language });
  }, []);

  return (
    <MenuContainer>
      <Menu>
        {supportedLanguages.map(({ label, code }) => (
          <MenuItem
            key={code}
            onPress={() => onSelectLanguage(code)}
            rightComponent={code === language && <MenuItem.StatusIcon status="selected" />}
            size={52}
            titleComponent={<MenuItem.Title text={label} />}
          />
        ))}
      </Menu>
    </MenuContainer>
  );
};
