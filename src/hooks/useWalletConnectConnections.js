import { groupBy, mapValues, values } from 'lodash';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { sortList } from '../helpers/sortList';
import { getAddressAndChainIdFromWCAccount } from '../model/walletConnect';
import {
  walletConnectDisconnectByDappUrl as rawwalletConnectDisconnectByDappUrl,
  walletConnectOnSessionRequest as rawWalletConnectOnSessionRequest,
  walletConnectUpdateSessionConnectorByDappUrl as rawWalletConnectUpdateSessionConnectorByDappUrl,
  walletConnectV2DisconnectAllSessions as rawWalletConnectV2DisconnectAllSessions,
  walletConnectV2DisconnectByDappUrl as rawwalletConnectV2DisconnectByDappUrl,
  walletConnectV2UpdateSessionByDappUrl as rawwalletConnectV2UpdateSessionByDappUrl,
} from '../redux/walletconnect';
import { WC_VERSION_1, WC_VERSION_2 } from '@rainbow-me/redux/requests';

const formatDappData = connections =>
  values(
    mapValues(connections, connection => ({
      account: connection?.[0].accounts?.[0],
      chainId: connection?.[0].chainId,
      dappIcon: connection?.[0].peerMeta?.icons?.[0],
      dappName: connection?.[0].peerMeta?.name,
      dappUrl: connection?.[0].peerMeta?.url,
      peerId: connection?.[0].peerId,
      version: WC_VERSION_1,
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
        dappIcon: icons?.[0],
        dappName: name,
        dappUrl: url,
        id: session.topic,
        version: WC_VERSION_2,
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

  const walletConnectDisconnectByDappUrl = useCallback(
    dappUrl => dispatch(rawwalletConnectDisconnectByDappUrl(dappUrl)),
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

  const walletConnectV2DisconnectAllSessions = useCallback(
    () => dispatch(rawWalletConnectV2DisconnectAllSessions()),
    [dispatch]
  );

  const walletConnectV2UpdateSessionByDappUrl = useCallback(
    (url, accountAddress, chainId) => {
      dispatch(
        rawwalletConnectV2UpdateSessionByDappUrl(url, accountAddress, chainId)
      );
    },
    [dispatch]
  );

  const walletConnectV2DisconnectByDappUrl = useCallback(
    url => {
      dispatch(rawwalletConnectV2DisconnectByDappUrl(url));
    },
    [dispatch]
  );

  return {
    sortedWalletConnectors,
    walletConnectDisconnectByDappUrl,
    walletConnectOnSessionRequest,
    walletConnectorsByDappName,
    walletConnectorsCount,
    walletConnectUpdateSessionConnectorByDappUrl,
    walletConnectV2DisconnectAllSessions,
    walletConnectV2DisconnectByDappUrl,
    walletConnectV2Sessions,
    walletConnectV2SessionsCount,
    walletConnectV2UpdateSessionByDappUrl,
  };
}
