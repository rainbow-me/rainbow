import React from 'react';
import styled from 'styled-components';
import { Sheet, SheetTitle } from '../components/sheet';
import WalletConnectListItem, {
  WalletConnectListItemHeight,
} from '../components/walletconnect-list/WalletConnectListItem';
import { useWalletConnectConnections } from '@rainbow-me/hooks';

const MAX_VISIBLE_DAPPS = 5;

const ScrollableItems = styled.ScrollView`
  height: ${({ length }) =>
    WalletConnectListItemHeight * Math.min(length, MAX_VISIBLE_DAPPS)};
`;

export default function ConnectedDappsSheet() {
  const { walletConnectorsByDappName } = useWalletConnectConnections();

  return (
    <Sheet borderRadius={30}>
      <SheetTitle>Connected apps</SheetTitle>
      <ScrollableItems length={walletConnectorsByDappName.length}>
        {walletConnectorsByDappName.map(({ dappIcon, dappName, dappUrl }) => (
          <WalletConnectListItem
            dappIcon={dappIcon}
            dappName={dappName}
            dappUrl={dappUrl}
            key={dappName}
          />
        ))}
      </ScrollableItems>
    </Sheet>
  );
}
