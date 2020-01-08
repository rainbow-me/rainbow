import { get, groupBy, mapValues, values } from 'lodash';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import { sortList } from '../helpers/sortList';
import { walletConnectDisconnectAllByDappName } from '../redux/walletconnect';

const mapStateToProps = ({ walletconnect: { walletConnectors } }) => ({
  walletConnectors,
});

const walletConnectorsSelector = state => state.walletConnectors;

const sortWalletConnectors = walletConnectors => {
  const sortedWalletConnectors = sortList(
    Object.values(walletConnectors),
    'peerMeta.name'
  );
  const sortedWalletConnectorsByDappName = groupBy(
    sortedWalletConnectors,
    'peerMeta.url'
  );
  const dappWalletConnector = mapValues(
    sortedWalletConnectorsByDappName,
    connectors => ({
      dappIcon: get(connectors, '[0].peerMeta.icons[0]'),
      dappName: get(connectors, '[0].peerMeta.name'),
      dappUrl: get(connectors, '[0].peerMeta.url'),
    })
  );

  return {
    sortedWalletConnectors,
    walletConnectorsByDappName: values(dappWalletConnector),
    walletConnectorsCount: sortedWalletConnectors.length,
  };
};

const walletConnectSelector = createSelector(
  [walletConnectorsSelector],
  sortWalletConnectors
);

export default Component =>
  compose(
    connect(mapStateToProps, {
      walletConnectDisconnectAllByDappName,
    }),
    withProps(walletConnectSelector)
  )(Component);
