import React from 'react';
import { CoinIcon } from '../coin-icon';
import { RowWithMargins } from '../layout';
import TokenInfoValue from './TokenInfoValue';
import { useColorForAsset } from '@rainbow-me/hooks';
import { magicMemo } from '@rainbow-me/utils';

const TokenInfoBalanceValue = ({ align, asset, ...props }) => {
  const { address, balance, symbol, value } = asset;
  const color = useColorForAsset(asset);

  return (
    <RowWithMargins
      {...props}
      align="center"
      direction={align === 'left' ? 'row' : 'row-reverse'}
      margin={5}
      marginKey={align === 'left' ? 'marginRight' : 'marginLeft'}
    >
      <CoinIcon address={address} size={20} symbol={symbol} />
      <TokenInfoValue color={color}>{balance?.display || value}</TokenInfoValue>
    </RowWithMargins>
  );
};

export default magicMemo(TokenInfoBalanceValue, 'asset');
