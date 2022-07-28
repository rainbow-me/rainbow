import values from 'lodash/values';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { sortList } from '../helpers/sortList';
import {
  walletConnectDisconnectAllByDappUrl as rawWalletConnectDisconnectAllByDappUrl,
  walletConnectOnSessionRequest as rawWalletConnectOnSessionRequest,
  walletConnectUpdateSessionConnectorByDappUrl as rawWalletConnectUpdateSessionConnectorByDappUrl,
} from '../redux/walletconnect';
import { groupBy } from '@rainbow-me/helpers/utilities';

const formatDappData = (connections: any) =>
  Object.values(
    Object.entries(connections).reduce((acc, [key, connection]) => {
      // @ts-expect-error
      acc[key] = {
        // @ts-expect-error FIXME: Object is of type 'unknown'.
        account: connection?.[0].accounts?.[0],
        // @ts-expect-error FIXME: Object is of type 'unknown'.
        chainId: connection?.[0].chainId,
        // @ts-expect-error FIXME: Object is of type 'unknown'.
        dappIcon: connection?.[0].peerMeta?.icons?.[0],
        // @ts-expect-error FIXME: Object is of type 'unknown'.
        dappName: connection?.[0].peerMeta?.name,
        // @ts-expect-error FIXME: Object is of type 'unknown'.
        dappUrl: connection?.[0].peerMeta?.url,
        // @ts-expect-error FIXME: Object is of type 'unknown'.
        handshakeId: connection?.[0]._handshakeId,
        // @ts-expect-error FIXME: Object is of type 'unknown'.
        peerId: connection?.[0].peerId, // unix timestamp in microseconds when connection was made
      };
      return acc;
    }, {})
  );

const walletConnectSelector = createSelector(
  // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
  state => state.walletconnect.walletConnectors,
  walletConnectors => {
    const sorted = sortList(values(walletConnectors), 'peerMeta.name');
    const groupedByDappName = groupBy(sorted, ({ peerMeta }) => peerMeta.url);
    const mostRecent = sortList(sorted, '_handshakeId', 'desc');

    const sortedByMostRecentHandshake = groupBy(
      mostRecent,
      ({ peerMeta }) => peerMeta.url
    );
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
    mostRecentWalletConnectors,
    sortedWalletConnectors,
    walletConnectDisconnectAllByDappUrl,
    walletConnectOnSessionRequest,
    walletConnectorsByDappName,
    walletConnectorsCount,
    walletConnectUpdateSessionConnectorByDappUrl,
  };
}
