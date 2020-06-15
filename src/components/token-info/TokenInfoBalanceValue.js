import React, { useMemo } from 'react';
import { magicMemo } from '../../utils';
import { CoinIcon } from '../coin-icon';
import { RowWithMargins } from '../layout';
import TokenInfoValue from './TokenInfoValue';

const TokenInfoBalanceValue = ({
  address,
  align,
  balance,
  color,
  shadowColor,
  symbol,
  value,
  ...props
}) => {
  const coinIconShadow = useMemo(() => [[0, 3, 9, shadowColor || color, 0.2]], [
    color,
    shadowColor,
  ]);

  return (
    <RowWithMargins
      {...props}
      align="center"
      direction={align === 'left' ? 'row' : 'row-reverse'}
      marginKey={align === 'left' ? 'marginRight' : 'marginLeft'}
      margin={5}
    >
      <CoinIcon
        address={address}
        shadow={coinIconShadow}
        size={20}
        symbol={symbol}
      />
      <TokenInfoValue color={color}>{balance?.display || value}</TokenInfoValue>
    </RowWithMargins>
  );
};

export default magicMemo(TokenInfoBalanceValue, ['balance.display', 'value']);
