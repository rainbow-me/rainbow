import React from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { CoinIcon } from '../coin-icon';
import { JellySelector, JellySelectorShadowIndicator } from '../jelly-selector';
import { RowWithMargins } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { ETH_ADDRESS } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { getTokenMetadata } from '@rainbow-me/utils';

const CurrencyItemHeight = 40;

const CurrencyItemLabel = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.blueGreyDark,
  letterSpacing: 'roundedMedium',
  size: 'larger',
  weight: 'bold',
}))`
  opacity: ${({ isSelected, theme: { isDarkMode } }) =>
    isSelected ? (isDarkMode ? 1 : 0.8) : 0.5};
  padding-bottom: 1.5;
`;

// eslint-disable-next-line react/display-name
const CurrencyItem = (isWalletEthZero: any) => ({
  item: address,
  isSelected,
}: any) => {
  const metadata = getTokenMetadata(address);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <RowWithMargins
      align="center"
      height={CurrencyItemHeight}
      margin={6}
      opacity={isWalletEthZero && address !== ETH_ADDRESS ? 0.5 : 1}
      paddingLeft={7}
      paddingRight={11}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <CoinIcon address={address} size={26} symbol={metadata?.symbol} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <CurrencyItemLabel isSelected={isSelected}>
        {metadata?.name}
      </CurrencyItemLabel>
    </RowWithMargins>
  );
};

const CurrencyItemRow = (props: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <RowWithMargins justify="center" margin={8} maxWidth={300} {...props} />
);

const AddCashSelector = ({
  currencies,
  initialCurrencyIndex,
  isWalletEthZero,
  onSelect,
}: any) => {
  const { isDarkMode, colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <JellySelector
      backgroundColor={isDarkMode ? colors.darkModeDark : colors.white}
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
};

const neverRerender = () => true;
export default React.memo(AddCashSelector, neverRerender);
