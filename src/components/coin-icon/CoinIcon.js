import { filter } from 'lodash';
import React, { Fragment, useMemo } from 'react';
import ReactCoinIcon from 'react-coin-icon';
import styled from 'styled-components/primitives';
import CoinIconFallback from './CoinIconFallback';
import CoinIconIndicator from './CoinIconIndicator';
import { useColorForAsset, useTokenMetadata } from '@rainbow-me/hooks';
import { RAINBOW_TOKEN_LIST } from '@rainbow-me/references/uniswap';
import { colors } from '@rainbow-me/styles';
import { isETH, magicMemo } from '@rainbow-me/utils';

export const CoinIconSize = 40;

const StyledCoinIcon = styled(ReactCoinIcon)`
  opacity: ${({ isHidden }) => (isHidden ? 0.4 : 1)};
`;

const tokensWithIcons = filter(RAINBOW_TOKEN_LIST.tokens, 'extensions.color')
  .map(({ address, symbol }) => [address, symbol])
  .flat();

const CoinIcon = ({
  address,
  isHidden,
  isPinned,
  size = CoinIconSize,
  symbol = '',
  ...props
}) => {
  const tokenMetadata = useTokenMetadata(address);
  const color = useColorForAsset({ address }, colors.dark);
  const shadowColor = tokenMetadata?.shadowColor || color;

  const forceFallback = useMemo(
    () =>
      !isETH(address)
        ? tokensWithIcons.includes(address)
        : tokensWithIcons.includes(symbol) && !isETH(symbol),
    [address, symbol]
  );

  return (
    <Fragment>
      {(isPinned || isHidden) && <CoinIconIndicator isPinned={isPinned} />}
      <StyledCoinIcon
        {...props}
        address={address}
        fallbackRenderer={CoinIconFallback}
        forceFallback={forceFallback}
        shadowColor={shadowColor}
        size={size}
        symbol={symbol}
      />
    </Fragment>
  );
};

export default magicMemo(CoinIcon, [
  'address',
  'isHidden',
  'isPinned',
  'size',
  'symbol',
]);
