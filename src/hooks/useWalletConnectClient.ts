// import { groupBy, mapValues, values } from 'lodash';
// import { useCallback } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { createSelector } from 'reselect';
// import { sortList } from '../helpers/sortList';
import {
  walletConnectAllSessions,
  walletConnectGetClient,
} from '../model/walletConnect';
// import {
//   walletConnectDisconnectAllByDappName as rawWalletConnectDisconnectAllByDappName,
//   walletConnectOnSessionRequest as rawWalletConnectOnSessionRequest,
//   walletConnectUpdateSessionConnectorByDappName as rawWalletConnectUpdateSessionConnectorByDappName,
// } from '../redux/walletconnect';

export default function useWalletConnectClient() {
  //   const dispatch = useDispatch();
  const walletConnectClient = walletConnectGetClient();
  const walletConnectSessions = walletConnectAllSessions();

  return {
    walletConnectClient,
    walletConnectSessions,
  };
}
