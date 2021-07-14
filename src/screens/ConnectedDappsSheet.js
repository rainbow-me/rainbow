import React, { useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { Sheet, SheetTitle } from '../components/sheet';
import WalletConnectListItem, {
  WalletConnectListItemHeight,
} from '../components/walletconnect-list/WalletConnectListItem';
import { useWalletConnectConnections } from '@rainbow-me/hooks';
import { walletConnectAllSessions } from '@rainbow-me/model/walletConnect';
import { useNavigation } from '@rainbow-me/navigation';

const MAX_VISIBLE_DAPPS = 5;

const ScrollableItems = styled.ScrollView`
  height: ${({ length }) =>
    WalletConnectListItemHeight * Math.min(length, MAX_VISIBLE_DAPPS)};
`;

export default function ConnectedDappsSheet() {
  const { goBack } = useNavigation();
  const { walletConnectorsByDappName } = useWalletConnectConnections();
  const walletConnectSessionsV2 = walletConnectAllSessions();

  const connectionsNumber = useMemo(
    () => walletConnectorsByDappName.length + walletConnectSessionsV2.length,
    [walletConnectorsByDappName, walletConnectSessionsV2]
  );

  useEffect(() => {
    if (connectionsNumber === 0) {
      goBack();
    }
  }, [goBack, connectionsNumber]);

  return (
    <Sheet borderRadius={30}>
      <SheetTitle>Connected apps</SheetTitle>
      <ScrollableItems length={connectionsNumber}>
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
        {walletConnectSessionsV2.map(
          ({ account, chainId, dappIcon, dappName, dappUrl }, i) => (
            <WalletConnectListItem
              account={account}
              chainId={chainId}
              dappIcon={dappIcon}
              dappName={dappName}
              dappUrl={dappUrl}
              key={i}
            />
          )
        )}
      </ScrollableItems>
    </Sheet>
  );
}
