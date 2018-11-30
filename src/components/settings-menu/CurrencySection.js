import { supportedNativeCurrencies } from 'balance-common';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Emoji from 'react-native-emoji';
import { withAccountSettings } from '../../hoc';
import { CoinIcon } from '../coin-icon';
import { OptionList, OptionListItem } from '../option-list';

const FlagEmoji = props => (
  <Emoji
    {...props}
    style={{ fontSize: 20, lineHeight: 0 }}
  />
);

const renderCurrencyIcon = (currency) => {
  if (!currency) return null;

  if (currency === 'EUR') return <FlagEmoji name="flag-eu" />;
  if (currency === 'GBP') return <FlagEmoji name="gb" />;
  if (currency === 'USD') return <FlagEmoji name="us" />;

  return (
    <CoinIcon
      showShadow={false}
      size={23}
      symbol={currency}
    />
  );
};

const CurrencyItems = Object.values(supportedNativeCurrencies).map((currency) => {
  console.log('map currency', currency);

  return currency;
});

class CurrencySection extends PureComponent {
  static propTypes = {
    accountChangeNativeCurrency: PropTypes.func.isRequired,
    nativeCurrency: PropTypes.oneOf(Object.keys(supportedNativeCurrencies)),
  }

  state = { selected: this.props.nativeCurrency }

  onSelectCurrency = (selectedCurrency) => () => {
    this.props.accountChangeNativeCurrency(selectedCurrency);
    this.setState({ selected: selectedCurrency });
  }

  renderListItem = ({ item: { currency, label } }) => (
    <OptionListItem
      icon={renderCurrencyIcon(currency)}
      key={currency}
      label={`${label} (${currency})`}
      onPress={this.onSelectCurrency(currency)}
      selected={this.state.selected === currency}
    />
  )

  render = () => {
    const items = CurrencyItems;
    console.log('🤑️🤑️🤑️curreny list items', items);

    return (
      <OptionList
        extraData={this.state}
        items={items}
        renderItem={this.renderListItem}
      />
    )
  }
}

export default withAccountSettings(CurrencySection);
