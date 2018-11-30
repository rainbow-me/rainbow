import { resources, supportedLanguages } from 'balance-common';
import { get, pickBy } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { withAccountSettings } from '../../hoc';
import { OptionList, OptionListItem } from '../option-list';

// Only show languages that have 'wallet' translations available.
const hasWalletTranslation = language => get(language, 'translation.wallet');
const filteredSupportedLanguages = pickBy(resources, hasWalletTranslation);
const languageItems = Object.keys(filteredSupportedLanguages).map(code => ({
  code,
  language: supportedLanguages[code],
}));

class LanguageSection extends PureComponent {
  static propTypes = {
    accountChangeLanguage: PropTypes.func.isRequired,
    language: PropTypes.string,
  }

  state = { selected: this.props.language }

  onSelectLanguage = (language) => () => {
    this.setState({ selected: language });
    this.props.accountChangeLanguage(language);
  }

  renderListItem = ({ item: { code, language } }) => (
    <OptionListItem
      key={code}
      label={language}
      onPress={this.onSelectLanguage(code)}
      selected={this.state.selected === code}
    />
  )

  render = () => (
    <OptionList
      extraData={this.state}
      items={languageItems}
      renderItem={this.renderListItem}
    />
  )
}

export default withAccountSettings(LanguageSection);
