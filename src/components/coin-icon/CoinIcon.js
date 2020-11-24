import { filter } from 'lodash';
import React, { Fragment, useMemo } from 'react';
import ReactCoinIcon from 'react-coin-icon';
import styled from 'styled-components/primitives';
import CoinIconFallback from './CoinIconFallback';
import CoinIconIndicator from './CoinIconIndicator';
import { useColorForAsset, useTokenMetadata } from '@rainbow-me/hooks';
import { RAINBOW_TOKEN_LIST } from '@rainbow-me/references/uniswap';
import { isETH, magicMemo } from '@rainbow-me/utils';

export const CoinIconSize = 40;

const StyledCoinIcon = styled(ReactCoinIcon)`
  background-color: ${({ color }) => {
    // We have to give the outermost wrapper a background color
    // or else React Native complains about shadow performance (and probably
    // our perf is actually effected too).
    // Read more about details of RN shadow / background requirements:
    // 📎️ https://github.com/facebook/react-native/commit/e4c53c28aea7e067e48f5c8c0100c7cafc031b06
    return color;
  }};
  opacity: ${({ isHidden }) => (isHidden ? 0.4 : 1)};
`;

// Create a flattened array containing all tokenAddresses and tokenSymbols for
// the tokens with nice SVG icons from our `react-coin-icons` package
const tokensWithIcons = filter(RAINBOW_TOKEN_LIST.tokens, 'extensions.color')
  .map(({ address, symbol }) => [address, symbol])
  .flat();

const isIconAvailable = addressOrSymbol =>
  tokensWithIcons.includes(addressOrSymbol);

const CoinIcon = ({
  address,
  isHidden,
  isPinned,
  size = CoinIconSize,
  symbol = '',
  ...props
}) => {
  const tokenMetadata = useTokenMetadata(address);
  const color = useColorForAsset({ address });

  const forceFallback = useMemo(
    () =>
      !isETH(address)
        ? isIconAvailable(address)
        : isIconAvailable(symbol) && !isETH(symbol),
    [address, symbol]
  );

  return (
    <Fragment>
      {(isPinned || isHidden) && <CoinIconIndicator isPinned={isPinned} />}
      <StyledCoinIcon
        {...props}
        address={address}
        color={color}
        fallbackRenderer={CoinIconFallback}
        forceFallback={forceFallback}
        shadowColor={tokenMetadata?.shadowColor || color}
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
