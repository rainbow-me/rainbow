import { groupBy, mapValues, values } from 'lodash';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { sortList } from '../helpers/sortList';
import {
  walletConnectDisconnectAllByPeerId as rawWalletConnectDisconnectAllByPeerId,
  walletConnectOnSessionRequest as rawWalletConnectOnSessionRequest,
  walletConnectUpdateSessionConnectorByPeerId as rawWalletConnectUpdateSessionConnectorByPeerId,
} from '../redux/walletconnect';

const formatDappData = connections =>
  values(
    mapValues(connections, connection => ({
      account: connection?.[0].accounts?.[0],
      chainId: connection?.[0].chainId,
      dappIcon: connection?.[0].peerMeta.icons[0],
      dappName: connection?.[0].peerMeta.name,
      dappUrl: connection?.[0].peerMeta.url,
      peerId: connection?.[0].peerId,
    }))
  );

const walletConnectSelector = createSelector(
  state => state.walletconnect.walletConnectors,
  walletConnectors => {
    const sorted = sortList(values(walletConnectors), 'peerMeta.name');
    const groupedByDappName = groupBy(sorted, 'peerMeta.url');
    return {
      sortedWalletConnectors: sorted,
      walletConnectorsByDappName: formatDappData(groupedByDappName),
      walletConnectorsCount: sorted.length,
    };
  }
);

export default function useWalletConnectConnections() {
  const dispatch = useDispatch();
  const {
    sortedWalletConnectors,
    walletConnectorsByDappName,
    walletConnectorsCount,
  } = useSelector(walletConnectSelector);

  const walletConnectDisconnectAllByPeerId = useCallback(
    peerId => dispatch(rawWalletConnectDisconnectAllByPeerId(peerId)),
    [dispatch]
  );

  const walletConnectOnSessionRequest = useCallback(
    (uri, callback) =>
      dispatch(rawWalletConnectOnSessionRequest(uri, callback)),
    [dispatch]
  );

  const walletConnectUpdateSessionConnectorByPeerId = useCallback(
    (peerId, accountAddress, chainId) =>
      dispatch(
        rawWalletConnectUpdateSessionConnectorByPeerId(
          peerId,
          accountAddress,
          chainId
        )
      ),
    [dispatch]
  );

  return {
    sortedWalletConnectors,
    walletConnectDisconnectAllByPeerId,
    walletConnectOnSessionRequest,
    walletConnectorsByDappName,
    walletConnectorsCount,
    walletConnectUpdateSessionConnectorByPeerId,
  };
}
