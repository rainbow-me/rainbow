import React from 'react';
import { ColumnWithMargins } from '../layout';
import TokenInfoBalanceValue from './TokenInfoBalanceValue';
import TokenInfoHeading from './TokenInfoHeading';
import TokenInfoValue from './TokenInfoValue';

export default function TokenInfoItem({
  align = 'left',
  asset,
  children,
  title,
  weight,
  ...props
}) {
  return (
    <ColumnWithMargins
      flex={asset ? 1 : 0}
      justify={align === 'left' ? 'start' : 'end'}
      margin={3}
      {...props}
    >
      <TokenInfoHeading align={align}>{title}</TokenInfoHeading>
      {asset ? (
        <TokenInfoBalanceValue align={align} asset={asset} />
      ) : (
        <TokenInfoValue align={align} weight={weight}>
          {children}
        </TokenInfoValue>
      )}
    </ColumnWithMargins>
  );
}
