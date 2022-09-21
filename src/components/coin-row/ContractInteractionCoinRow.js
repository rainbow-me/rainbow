import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { ButtonPressAnimation } from '../animations';
import { CoinIconSize, RequestVendorLogoIcon } from '../coin-icon';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import TransactionStatusBadge from './TransactionStatusBadge';
import styled from '@/styled-thing';
import { ethereumUtils, showActionSheetWithOptions } from '@/utils';

const BottomRow = ({ dappName }) => <CoinName>{dappName}</CoinName>;

const ContractInteractionVenderLogoIcon = styled(RequestVendorLogoIcon).attrs({
  borderRadius: CoinIconSize,
})({});

export default function ContractInteractionCoinRow({
  item: { hash, ...item },
  ...props
}) {
  const handlePressTransaction = useCallback(() => {
    if (!hash) return;
    showActionSheetWithOptions(
      {
        cancelButtonIndex: 1,
        options: [
          lang.t('exchange.coin_row.view_on_etherscan'),
          lang.t('button.cancel'),
        ],
      },
      buttonIndex => {
        if (buttonIndex === 0) {
          ethereumUtils.openTransactionInBlockExplorer(hash);
        }
      }
    );
  }, [hash]);

  return (
    <ButtonPressAnimation onPress={handlePressTransaction} scaleTo={0.98}>
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
