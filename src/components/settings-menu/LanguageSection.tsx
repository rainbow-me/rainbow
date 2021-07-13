import analytics from '@segment/analytics-react-native';
import { get, keys, pickBy } from 'lodash';
import React, { useCallback } from 'react';
import { resources, supportedLanguages } from '../../languages';
import { RadioList, RadioListItem } from '../radio-list';
import { useAccountSettings } from '@rainbow-me/hooks';

// Only show languages that have 'wallet' translations available.
const hasWalletTranslations = language => get(language, 'translation.wallet');
const languagesWithWalletTranslations = keys(
  pickBy(resources, hasWalletTranslations)
);

const languageListItems = languagesWithWalletTranslations.map(code => ({
  code,
  key: code,
  language: supportedLanguages[code],
  value: code,
}));

const renderLanguageListItem = ({ code, language, ...item }) => (
  <RadioListItem {...item} label={language} value={code} />
);

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
    <RadioList
      extraData={language}
      items={languageListItems}
      marginTop={7}
      onChange={onSelectLanguage}
      renderItem={renderLanguageListItem}
      value={language}
    />
  );
};

export default LanguageSection;
