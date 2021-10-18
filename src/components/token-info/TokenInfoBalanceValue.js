import React from 'react';
import styled from 'styled-components';
import { CoinIcon } from '../coin-icon';
import { RowWithMargins } from '../layout';
import TokenInfoValue from './TokenInfoValue';
import { useColorForAsset } from '@rainbow-me/hooks';
import { magicMemo } from '@rainbow-me/utils';

const InfoValue = styled(TokenInfoValue)`
  ${android ? 'height: 37.7;' : ''}
`;

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
      <InfoValue color={color}>{balance?.display || value}</InfoValue>
    </RowWithMargins>
  );
};

export default magicMemo(TokenInfoBalanceValue, 'asset');
