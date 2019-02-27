import { sortList } from 'balance-common';
import {
  head,
  groupBy,
  mapValues,
  values,
} from 'lodash';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import {
  walletConnectInitAllConnectors,
  walletConnectDisconnectAllByDappName,
} from '../redux/walletconnect';

const mapStateToProps = ({ walletconnect: { walletConnectors } }) => ({ walletConnectors });

const walletConnectorsSelector = state => state.walletConnectors;

const sortWalletConnectors = (walletConnectors) => {
  console.log('walletConnectors', walletConnectors);
  const sortedWalletConnectors = sortList(Object.values(walletConnectors), 'peerMeta.name');
  const sortedWalletConnectorsByDappName = groupBy(sortedWalletConnectors, 'peerMeta.url');
  const dappWalletConnector = mapValues(sortedWalletConnectorsByDappName, (connectors) => {
    const firstElement = head(connectors);
    return {
      dappName: firstElement.peerMeta.name,
      dappIcon: firstElement.peerMeta.icons[0],
      dappUrl: firstElement.peerMeta.url,
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
    walletConnectInitAllConnectors,
    walletConnectDisconnectAllByDappName,
  }),
  withProps(walletConnectSelector),
)(Component);
