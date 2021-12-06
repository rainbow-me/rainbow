import React, { useCallback } from 'react';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { CoinIconSize, RequestVendorLogoIcon } from '../coin-icon';
import CoinName from './CoinName';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinRow' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import CoinRow from './CoinRow';
// @ts-expect-error ts-migrate(6142) FIXME: Module './TransactionStatusBadge' was resolved to ... Remove this comment to see the full error message
import TransactionStatusBadge from './TransactionStatusBadge';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils, showActionSheetWithOptions } from '@rainbow-me/utils';

// @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
const BottomRow = ({ dappName }: any) => <CoinName>{dappName}</CoinName>;

const ContractInteractionVenderLogoIcon = styled(RequestVendorLogoIcon).attrs({
  borderRadius: CoinIconSize,
})``;

export default function ContractInteractionCoinRow({
  item: { hash, ...item },
  ...props
}: any) {
  const handlePressTransaction = useCallback(() => {
    if (!hash) return;
    showActionSheetWithOptions(
      {
        cancelButtonIndex: 1,
        options: ['View on Etherscan', 'Cancel'],
      },
      (buttonIndex: any) => {
        if (buttonIndex === 0) {
          ethereumUtils.openTransactionInBlockExplorer(hash);
        }
      }
    );
  }, [hash]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation onPress={handlePressTransaction} scaleTo={0.98}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <CoinRow
        {...item}
        {...props}
        bottomRowRender={BottomRow}
        coinIconRender={ContractInteractionVenderLogoIcon}
        topRowRender={TransactionStatusBadge}
      />
    </ButtonPressAnimation>
  );
}
