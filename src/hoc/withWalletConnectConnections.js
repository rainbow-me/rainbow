import {
  get,
  groupBy,
  head,
  mapValues,
  values,
} from 'lodash';
import { sortList } from '@rainbow-me/rainbow-common';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import {
  walletConnectDisconnectAllByDappName,
  walletConnectInitAllConnectors,
} from '../redux/walletconnect';

const mapStateToProps = ({ walletconnect: { walletConnectors } }) => ({ walletConnectors });

const walletConnectorsSelector = state => state.walletConnectors;

const sortWalletConnectors = (walletConnectors) => {
  const sortedWalletConnectors = sortList(Object.values(walletConnectors), 'peerMeta.name');
  const sortedWalletConnectorsByDappName = groupBy(sortedWalletConnectors, 'peerMeta.url');
  const dappWalletConnector = mapValues(sortedWalletConnectorsByDappName, (connectors) => {
    const firstElement = head(connectors);
    return {
      dappName: get(firstElement, 'peerMeta.name'),
      dappIcon: get(firstElement, 'peerMeta.icons[0]'),
      dappUrl: get(firstElement, 'peerMeta.url'),
    };
  });
  return {
    sortedWalletConnectors,
    walletConnectorsByDappName: values(dappWalletConnector),
    walletConnectorsCount: sortedWalletConnectors.length,
  };
};

const walletConnectSelector = createSelector(
  [walletConnectorsSelector],
  sortWalletConnectors,
);

export default Component => compose(
  connect(mapStateToProps, {
    walletConnectDisconnectAllByDappName,
    walletConnectInitAllConnectors,
  }),
  withProps(walletConnectSelector),
)(Component);
