import {
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
  getValidWalletConnectors,
  removeWalletConnectorByDapp,
  setWalletConnectors,
} from '../redux/walletconnect';

const mapStateToProps = ({ walletconnect: { walletConnectors } }) => ({ walletConnectors });

const walletConnectorsSelector = state => state.walletConnectors;

const sortWalletConnectors = (walletConnectors) => {
  const sortedWalletConnectors = sortList(Object.values(walletConnectors), 'expires');
  const sortedWalletConnectorsByDappName = groupBy(sortedWalletConnectors, 'dappName');
  const dappWalletConnector = mapValues(sortedWalletConnectorsByDappName, (connectors) => {
    const firstElement = head(connectors);
    return {
      dappName: firstElement.dappName,
      expires: firstElement.expires,
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
    getValidWalletConnectors,
    removeWalletConnectorByDapp,
    setWalletConnectors,
  }),
  withProps(walletConnectSelector),
)(Component);
