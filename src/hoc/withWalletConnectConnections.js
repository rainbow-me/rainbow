import {
  get,
  groupBy,
  head,
  mapValues,
  values,
} from 'lodash';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import { sortList } from '../helpers/sortList';
import {
  walletConnectClearTimestamp,
  walletConnectDisconnectAllByDappName,
  walletConnectUpdateTimestamp,
} from '../redux/walletconnect';

const mapStateToProps = ({ walletconnect: { walletConnectors } }) => ({ walletConnectors });

const walletConnectorsSelector = state => state.walletConnectors;

const sortWalletConnectors = (walletConnectors) => {
  const sortedWalletConnectors = sortList(Object.values(walletConnectors), 'peerMeta.name');
  const sortedWalletConnectorsByDappName = groupBy(sortedWalletConnectors, 'peerMeta.url');
  const dappWalletConnector = mapValues(sortedWalletConnectorsByDappName, (connectors) => {
    const firstElement = head(connectors);
    return {
      dappIcon: get(firstElement, 'peerMeta.icons[0]'),
      dappName: get(firstElement, 'peerMeta.name'),
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
    walletConnectClearTimestamp,
    walletConnectDisconnectAllByDappName,
    walletConnectUpdateTimestamp,
  }),
  withProps(walletConnectSelector),
)(Component);
