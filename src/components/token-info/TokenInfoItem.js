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
  hidden,
  ...props
}) {
  return (
    <ColumnWithMargins
      flex={asset ? 1 : 0}
      justify={align === 'left' ? 'start' : 'end'}
      margin={android ? -6 : 3}
      {...props}
    >
      <TokenInfoHeading align={align}>{hidden ? '' : title}</TokenInfoHeading>
      {asset && !hidden ? (
        <TokenInfoBalanceValue align={align} asset={asset} />
      ) : (
        <TokenInfoValue align={align} weight={weight}>
          {!hidden && children}
        </TokenInfoValue>
      )}
    </ColumnWithMargins>
  );
}
