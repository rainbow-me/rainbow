import React, { useMemo } from 'react';
import { useColorForAsset } from '../../hooks';
import { magicMemo } from '../../utils';
import { CoinIcon } from '../coin-icon';
import { RowWithMargins } from '../layout';
import TokenInfoValue from './TokenInfoValue';
import { colors } from '@rainbow-me/styles';

const TokenInfoBalanceValue = ({ align, asset, ...props }) => {
  const { address, balance, shadowColor, symbol, value } = asset;

  const color = useColorForAsset(asset);
  const coinIconShadow = useMemo(
    () => [
      [0, 3, 9, symbol === 'ETH' ? colors.dark : shadowColor || color, 0.2],
    ],
    [color, shadowColor, symbol]
  );

  return (
    <RowWithMargins
      {...props}
      align="center"
      direction={align === 'left' ? 'row' : 'row-reverse'}
      margin={5}
      marginKey={align === 'left' ? 'marginRight' : 'marginLeft'}
    >
      <CoinIcon
        address={address}
        shadow={coinIconShadow}
        size={20}
        symbol={symbol}
      />
      <TokenInfoValue color={symbol === 'ETH' ? colors.dark : color}>
        {balance?.display || value}
      </TokenInfoValue>
    </RowWithMargins>
  );
};

export default magicMemo(TokenInfoBalanceValue, 'asset');
