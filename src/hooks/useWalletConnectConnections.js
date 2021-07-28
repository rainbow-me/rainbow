import { groupBy, mapValues, values } from 'lodash';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { sortList } from '../helpers/sortList';
import { getAddressAndChainIdFromWCAccount } from '../model/walletConnect';
import {
  walletConnectDisconnectAllByDappName as rawWalletConnectDisconnectAllByDappName,
  walletConnectOnSessionRequest as rawWalletConnectOnSessionRequest,
  walletConnectUpdateSessionConnectorByDappName as rawWalletConnectUpdateSessionConnectorByDappName,
  walletConnectV2DisconnectAllSessions as rawWalletConnectV2DisconnectAllSessions,
  walletConnectV2DisconnectByDappName as rawWalletConnectV2DisconnectByDappName,
  walletConnectV2UpdateSessionByDappName as rawWalletConnectV2UpdateSessionByDappName,
} from '../redux/walletconnect';

const formatDappData = connections =>
  values(
    mapValues(connections, connection => ({
      dappIcon: connection?.[0].peerMeta.icons[0],
      dappName: connection?.[0].peerMeta.name,
      dappUrl: connection?.[0].peerMeta.url,
    }))
  );

const formatSessionsData = clientV2Sessions =>
  values(
    mapValues(clientV2Sessions, session => {
      const accounts = session?.state?.accounts;
      const { name, url, icons } = session?.peer?.metadata;
      const { address, chainId } = getAddressAndChainIdFromWCAccount(
        accounts?.[0]
      );
      return {
        account: address,
        chainId,
        dappIcon: icons[0],
        dappName: name,
        dappUrl: url,
        version: 'v2',
      };
    })
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

const walletConnectV2Selector = createSelector(
  state => state.walletconnect.clientV2Sessions,
  clientV2Sessions => ({
    walletConnectV2Sessions: formatSessionsData(clientV2Sessions),
    walletConnectV2SessionsCount: clientV2Sessions.length,
  })
);

export default function useWalletConnectConnections() {
  const dispatch = useDispatch();
  const {
    sortedWalletConnectors,
    walletConnectorsByDappName,
    walletConnectorsCount,
  } = useSelector(walletConnectSelector);

  const { walletConnectV2Sessions, walletConnectV2SessionsCount } = useSelector(
    walletConnectV2Selector
  );

  const walletConnectDisconnectAllByDappName = useCallback(
    dappName => dispatch(rawWalletConnectDisconnectAllByDappName(dappName)),
    [dispatch]
  );

  const walletConnectOnSessionRequest = useCallback(
    (uri, callback) =>
      dispatch(rawWalletConnectOnSessionRequest(uri, callback)),
    [dispatch]
  );

  const walletConnectUpdateSessionConnectorByDappName = useCallback(
    (dappName, accountAddress, chainId) =>
      dispatch(
        rawWalletConnectUpdateSessionConnectorByDappName(
          dappName,
          accountAddress,
          chainId
        )
      ),
    [dispatch]
  );

  const walletConnectV2DisconnectAllSessions = useCallback(
    () => dispatch(rawWalletConnectV2DisconnectAllSessions()),
    [dispatch]
  );

  const walletConnectV2UpdateSessionByDappName = useCallback(
    (dappName, accountAddress, chainId) => {
      dispatch(
        rawWalletConnectV2UpdateSessionByDappName(
          dappName,
          accountAddress,
          chainId
        )
      );
    },
    [dispatch]
  );

  const walletConnectV2DisconnectByDappName = useCallback(
    dappName => {
      dispatch(rawWalletConnectV2DisconnectByDappName(dappName));
    },
    [dispatch]
  );

  return {
    sortedWalletConnectors,
    walletConnectDisconnectAllByDappName,
    walletConnectOnSessionRequest,
    walletConnectorsByDappName,
    walletConnectorsCount,
    walletConnectUpdateSessionConnectorByDappName,
    walletConnectV2DisconnectAllSessions,
    walletConnectV2DisconnectByDappName,
    walletConnectV2Sessions,
    walletConnectV2SessionsCount,
    walletConnectV2UpdateSessionByDappName,
  };
}
