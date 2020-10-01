import React from 'react';
import { Linking } from 'react-native';
import { compose, mapProps, onlyUpdateForKeys, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { withAccountSettings } from '../../hoc';
import { ButtonPressAnimation } from '../animations';
import { CoinIconSize, RequestVendorLogoIcon } from '../coin-icon';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import TransactionStatusBadge from './TransactionStatusBadge';
import { ethereumUtils, showActionSheetWithOptions } from '@rainbow-me/utils';

const BottomRow = ({ dappName }) => <CoinName>{dappName}</CoinName>;
const TopRow = ({ status, title }) => (
  <TransactionStatusBadge status={status} title={title} />
);

const ContractInteractionVenderLogoIcon = styled(RequestVendorLogoIcon).attrs({
  borderRadius: CoinIconSize,
})``;

const ContractInteractionCoinRow = ({ item, onPressTransaction, ...props }) => (
  <ButtonPressAnimation onPress={onPressTransaction} scaleTo={0.98}>
    <CoinRow
      {...item}
      {...props}
      bottomRowRender={BottomRow}
      coinIconRender={ContractInteractionVenderLogoIcon}
      topRowRender={TopRow}
    />
  </ButtonPressAnimation>
);

export default compose(
  mapProps(({ item: { hash, pending, ...item }, ...props }) => ({
    hash,
    item,
    pending,
    ...props,
  })),
  withAccountSettings,
  withHandlers({
    onPressTransaction: ({ hash, network }) => () => {
      if (hash) {
        showActionSheetWithOptions(
          {
            cancelButtonIndex: 1,
            options: ['View on Etherscan', 'Cancel'],
          },
          buttonIndex => {
            if (buttonIndex === 0) {
              const normalizedHash = hash.replace(/-.*/g, '');
              const etherscanHost = ethereumUtils.getEtherscanHostFromNetwork(
                network
              );
              Linking.openURL(`https://${etherscanHost}/tx/${normalizedHash}`);
            }
          }
        );
      }
    },
  }),
  onlyUpdateForKeys(['hash', 'pending'])
)(ContractInteractionCoinRow);
