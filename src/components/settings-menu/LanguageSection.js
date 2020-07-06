import analytics from '@segment/analytics-react-native';
import { get, keys, pickBy } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
import { withAccountSettings } from '../../hoc';
import { resources, supportedLanguages } from '../../languages';
import { RadioList, RadioListItem } from '../radio-list';

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

const LanguageSection = ({ language, onSelectLanguage }) => (
  <RadioList
    extraData={language}
    items={languageListItems}
    marginTop={7}
    onChange={onSelectLanguage}
    renderItem={renderLanguageListItem}
    value={language}
  />
);

LanguageSection.propTypes = {
  language: PropTypes.string,
  onSelectLanguage: PropTypes.func.isRequired,
};

export default compose(
  withAccountSettings,
  withHandlers({
    onSelectLanguage: ({ settingsChangeLanguage }) => language => {
      settingsChangeLanguage(language);
      analytics.track('Changed language', { language });
    },
  }),
  onlyUpdateForKeys(['language'])
)(LanguageSection);
