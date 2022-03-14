import { groupBy, mapValues, values } from 'lodash';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { sortList } from '../helpers/sortList';
import {
  walletConnectDisconnectAllByDappUrl as rawWalletConnectDisconnectAllByDappUrl,
  walletConnectOnSessionRequest as rawWalletConnectOnSessionRequest,
  walletConnectUpdateSessionConnectorByDappUrl as rawWalletConnectUpdateSessionConnectorByDappUrl,
} from '../redux/walletconnect';

const formatDappData = connections =>
  values(
    mapValues(connections, connection => ({
      account: connection?.[0].accounts?.[0],
      chainId: connection?.[0].chainId,
      dappIcon: connection?.[0].peerMeta?.icons?.[0],
      dappName: connection?.[0].peerMeta?.name,
      dappUrl: connection?.[0].peerMeta?.url,
      peerId: connection?.[0].peerId,
      handshakeId: connection?.[0]._handshakeId, // unix timestamp in microseconds when connection was made
    }))
  );

const walletConnectSelector = createSelector(
  state => state.walletconnect.walletConnectors,
  walletConnectors => {
    const sorted = sortList(values(walletConnectors), 'peerMeta.name');
    const groupedByDappName = groupBy(sorted, 'peerMeta.url');
    const mostRecent = sortList(sorted, '_handshakeId', 'desc');
    const sortedByMostRecentHandshake = groupBy(mostRecent, 'peerMeta.url');
    return {
      sortedWalletConnectors: sorted,
      mostRecentWalletConnectors: formatDappData(sortedByMostRecentHandshake),
      walletConnectorsByDappName: formatDappData(groupedByDappName),
      walletConnectorsCount: sorted.length,
    };
  }
);

export default function useWalletConnectConnections() {
  const dispatch = useDispatch();
  const {
    sortedWalletConnectors,
    mostRecentWalletConnectors,
    walletConnectorsByDappName,
    walletConnectorsCount,
  } = useSelector(walletConnectSelector);

  const walletConnectDisconnectAllByDappUrl = useCallback(
    dappUrl => dispatch(rawWalletConnectDisconnectAllByDappUrl(dappUrl)),
    [dispatch]
  );

  const walletConnectOnSessionRequest = useCallback(
    (uri, callback) =>
      dispatch(rawWalletConnectOnSessionRequest(uri, callback)),
    [dispatch]
  );

  const walletConnectUpdateSessionConnectorByDappUrl = useCallback(
    (dappUrl, accountAddress, chainId) =>
      dispatch(
        rawWalletConnectUpdateSessionConnectorByDappUrl(
          dappUrl,
          accountAddress,
          chainId
        )
      ),
    [dispatch]
  );

  return {
    sortedWalletConnectors,
    mostRecentWalletConnectors,
    walletConnectDisconnectAllByDappUrl,
    walletConnectOnSessionRequest,
    walletConnectorsByDappName,
    walletConnectorsCount,
    walletConnectUpdateSessionConnectorByDappUrl,
  };
}
