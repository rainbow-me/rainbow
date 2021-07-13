import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Sheet, SheetTitle } from '../components/sheet';
import WalletConnectListItem, {
  WalletConnectListItemHeight,
} from '../components/walletconnect-list/WalletConnectListItem';
import { useWalletConnectConnections } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';

const MAX_VISIBLE_DAPPS = 5;

const ScrollableItems = styled.ScrollView`
  height: ${({ length }) =>
    WalletConnectListItemHeight * Math.min(length, MAX_VISIBLE_DAPPS)};
`;

export default function ConnectedDappsSheet() {
  const { walletConnectorsByDappName } = useWalletConnectConnections();
  const { goBack } = useNavigation();

  useEffect(() => {
    if (walletConnectorsByDappName.length === 0) {
      goBack();
    }
  }, [goBack, walletConnectorsByDappName.length]);

  return (
    <Sheet borderRadius={30}>
      <SheetTitle>Connected apps</SheetTitle>
      <ScrollableItems length={walletConnectorsByDappName.length}>
        {walletConnectorsByDappName.map(
          ({ account, chainId, dappIcon, dappName, dappUrl }) => (
            <WalletConnectListItem
              account={account}
              chainId={chainId}
              dappIcon={dappIcon}
              dappName={dappName}
              dappUrl={dappUrl}
              key={dappName}
            />
          )
        )}
      </ScrollableItems>
    </Sheet>
  );
}
