import { groupBy, mapValues, values } from 'lodash';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { sortList } from '../helpers/sortList';
import {
  walletConnectDisconnectAllByDappUrl as rawWalletConnectDisconnectAllByDappUrl,
  walletConnectOnSessionRequest as rawWalletConnectOnSessionRequest,
  WalletconnectRequestCallback,
  walletConnectUpdateSessionConnectorByDappUrl as rawWalletConnectUpdateSessionConnectorByDappUrl,
} from '../redux/walletconnect';
import { AppState } from '@/redux/store';

const formatDappData = (connections: any) =>
  values(
    mapValues(connections, connection => ({
      account: connection?.[0].accounts?.[0],
      chainId: connection?.[0].chainId,
      dappIcon: connection?.[0].peerMeta?.icons?.[0],
      dappName: connection?.[0].peerMeta?.name,
      dappUrl: connection?.[0].peerMeta?.url,
      handshakeId: connection?.[0]._handshakeId,
      peerId: connection?.[0].peerId, // unix timestamp in microseconds when connection was made
    }))
  );

const walletConnectSelector = createSelector(
  (state: AppState) => state.walletconnect.walletConnectors,
  walletConnectors => {
    const sorted = sortList(values(walletConnectors), 'peerMeta.name');
    const groupedByDappName = groupBy(sorted, 'peerMeta.url');
    const mostRecent = sortList(sorted, '_handshakeId', 'desc');
    const sortedByMostRecentHandshake = groupBy(mostRecent, 'peerMeta.url');
    return {
      mostRecentWalletConnectors: formatDappData(sortedByMostRecentHandshake),
      sortedWalletConnectors: sorted,
      walletConnectorsByDappName: formatDappData(groupedByDappName),
      walletConnectorsCount: sorted.length,
    };
  }
);

export default function useWalletConnectConnections() {
  const dispatch = useDispatch();
  const { sortedWalletConnectors, mostRecentWalletConnectors, walletConnectorsByDappName, walletConnectorsCount } =
    useSelector(walletConnectSelector);

  const walletConnectDisconnectAllByDappUrl = useCallback(
    (dappUrl: string) => dispatch(rawWalletConnectDisconnectAllByDappUrl(dappUrl)),
    [dispatch]
  );

  const walletConnectOnSessionRequest = useCallback(
    (uri: string, connector?: string, callback?: WalletconnectRequestCallback) =>
      dispatch(rawWalletConnectOnSessionRequest(uri, connector, callback)),
    [dispatch]
  );

  const walletConnectUpdateSessionConnectorByDappUrl = useCallback(
    (dappUrl: string, accountAddress: string, chainId: number) =>
      dispatch(rawWalletConnectUpdateSessionConnectorByDappUrl(dappUrl, accountAddress, chainId)),
    [dispatch]
  );

  return {
    mostRecentWalletConnectors,
    sortedWalletConnectors,
    walletConnectDisconnectAllByDappUrl,
    walletConnectOnSessionRequest,
    walletConnectorsByDappName,
    walletConnectorsCount,
    walletConnectUpdateSessionConnectorByDappUrl,
  };
}
