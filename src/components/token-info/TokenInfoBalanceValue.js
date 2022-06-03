import React from 'react';
import { CoinIcon } from '../coin-icon';
import { RowWithMargins } from '../layout';
import TokenInfoValue from './TokenInfoValue';
import { useColorForAsset } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { magicMemo } from '@rainbow-me/utils';

const InfoValue = styled(TokenInfoValue)(android ? { height: 37.7 } : {});

const TokenInfoBalanceValue = ({ align, asset, ...props }) => {
  const { address, balance, symbol, type, value } = asset;
  const color = useColorForAsset(asset);

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
        ignoreBadge
        size={20}
        symbol={symbol}
        type={type}
      />
      <InfoValue color={color}>{balance?.display || value}</InfoValue>
    </RowWithMargins>
  );
};

export default magicMemo(TokenInfoBalanceValue, 'asset');
