import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { resources, supportedLanguages } from '../../../languages';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import { analytics } from '@/analytics';
import { pickBy } from '@/helpers/utilities';
import { useAccountSettings } from '@/hooks';
import { BackgroundProvider, Box, Inline, Inset, Text } from '@/design-system';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';

const languagesWithWalletTranslations = Object.keys(
  pickBy(resources, language => language?.translation?.wallet) // Only show languages that have 'wallet' translations available.
);

const languageListItems = languagesWithWalletTranslations.map(code => ({
  code,
  name: (supportedLanguages as any)[code].label,
}));

const LanguageSection = () => {
  const { language, settingsChangeLanguage } = useAccountSettings();

  const onSelectLanguage = useCallback(
    (language: string) => {
      settingsChangeLanguage(language);
      analytics.track('Changed language', { language });
    },
    [settingsChangeLanguage]
  );

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet backgroundColor={backgroundColor as string}>
          <Inset top="20px" horizontal="20px" bottom="60px">
            <Inline alignHorizontal="center" alignVertical="center">
              <Box paddingBottom="12px">
                <Text size="22pt" weight="heavy" color="label">
                  {lang.t('settings.language')}
                </Text>
              </Box>
            </Inline>
            <Box>
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
            </Box>
          </Inset>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
};

export default LanguageSection;
