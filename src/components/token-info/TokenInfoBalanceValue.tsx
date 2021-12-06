import React from 'react';
import styled from 'styled-components';
import { CoinIcon } from '../coin-icon';
import { RowWithMargins } from '../layout';
import TokenInfoValue from './TokenInfoValue';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useColorForAsset } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { magicMemo } from '@rainbow-me/utils';

const InfoValue = styled(TokenInfoValue)`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${android ? 'height: 37.7;' : ''}
`;

const TokenInfoBalanceValue = ({ align, asset, ...props }: any) => {
  const { address, balance, symbol, value } = asset;
  const color = useColorForAsset(asset);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <RowWithMargins
      {...props}
      align="center"
      direction={align === 'left' ? 'row' : 'row-reverse'}
      margin={5}
      marginKey={align === 'left' ? 'marginRight' : 'marginLeft'}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <CoinIcon address={address} size={20} symbol={symbol} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <InfoValue color={color}>{balance?.display || value}</InfoValue>
    </RowWithMargins>
  );
};

export default magicMemo(TokenInfoBalanceValue, 'asset');
