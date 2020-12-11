import React from 'react';
import styled from 'styled-components/primitives';
import { CoinIcon } from '../coin-icon';
import { JellySelector, JellySelectorShadowIndicator } from '../jelly-selector';
import { RowWithMargins } from '../layout';
import { Text } from '../text';
import { ETH_ADDRESS } from '@rainbow-me/references';
import { colors } from '@rainbow-me/styles';
import { getTokenMetadata } from '@rainbow-me/utils';

const CurrencyItemHeight = 40;

const CurrencyItemLabel = styled(Text).attrs({
  color: colors.blueGreyDark,
  letterSpacing: 'roundedMedium',
  size: 'larger',
  weight: 'semibold',
})`
  opacity: ${({ isSelected }) => (isSelected ? 0.8 : 0.6)};
  padding-bottom: 1.5;
`;

// eslint-disable-next-line react/display-name
const CurrencyItem = isWalletEthZero => ({ item: address, isSelected }) => {
  const metadata = getTokenMetadata(address);

  return (
    <RowWithMargins
      align="center"
      height={CurrencyItemHeight}
      margin={6}
      opacity={isWalletEthZero && address !== ETH_ADDRESS ? 0.5 : 1}
      paddingLeft={7}
      paddingRight={11}
    >
      <CoinIcon address={address} size={26} symbol={metadata?.symbol} />
      <CurrencyItemLabel isSelected={isSelected}>
        {metadata?.name}
      </CurrencyItemLabel>
    </RowWithMargins>
  );
};

const CurrencyItemRow = props => (
  <RowWithMargins justify="center" margin={8} maxWidth={300} {...props} />
);

const AddCashSelector = ({
  currencies,
  initialCurrencyIndex,
  isWalletEthZero,
  onSelect,
}) => (
  <JellySelector
    defaultIndex={initialCurrencyIndex}
    disableSelection={isWalletEthZero}
    height={CurrencyItemHeight}
    items={currencies}
    onSelect={onSelect}
    renderIndicator={JellySelectorShadowIndicator}
    renderItem={CurrencyItem(isWalletEthZero)}
    renderRow={CurrencyItemRow}
  />
);

const neverRerender = () => true;
export default React.memo(AddCashSelector, neverRerender);
