import React, { useCallback } from 'react';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { CoinIconSize, RequestVendorLogoIcon } from '../coin-icon';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import TransactionStatusBadge from './TransactionStatusBadge';
import { useEtherscan } from '@rainbow-me/hooks';
import { showActionSheetWithOptions } from '@rainbow-me/utils';

const BottomRow = ({ dappName }) => <CoinName>{dappName}</CoinName>;

const ContractInteractionVenderLogoIcon = styled(RequestVendorLogoIcon).attrs({
  borderRadius: CoinIconSize,
})``;

export default function ContractInteractionCoinRow({
  item: { hash, ...item },
  ...props
}) {
  const { openTransactionEtherscanURL } = useEtherscan();

  const handlePressTransaction = useCallback(() => {
    if (!hash) return;
    showActionSheetWithOptions(
      {
        cancelButtonIndex: 1,
        options: ['View on Etherscan', 'Cancel'],
      },
      buttonIndex => {
        if (buttonIndex === 0) {
          openTransactionEtherscanURL(hash);
        }
      }
    );
  }, [hash, openTransactionEtherscanURL]);

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
