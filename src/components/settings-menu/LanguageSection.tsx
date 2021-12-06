import analytics from '@segment/analytics-react-native';
import { get, keys, pickBy } from 'lodash';
import React, { useCallback } from 'react';
import { resources, supportedLanguages } from '../../languages';
import { RadioList, RadioListItem } from '../radio-list';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings } from '@rainbow-me/hooks';

// Only show languages that have 'wallet' translations available.
const hasWalletTranslations = (language: any) =>
  get(language, 'translation.wallet');
const languagesWithWalletTranslations = keys(
  pickBy(resources, hasWalletTranslations)
);

const languageListItems = languagesWithWalletTranslations.map(code => ({
  code,
  key: code,
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  language: supportedLanguages[code],
  value: code,
}));

const renderLanguageListItem = ({ code, language, ...item }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
