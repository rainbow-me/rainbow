import { head, groupBy, mapValues, values } from 'lodash';
import { compose, withProps } from 'recompact';
import { connect } from 'react-redux';
import {
  getValidWalletConnectors,
  removeWalletConnectorByDapp,
  setWalletConnectors,
} from '../redux/walletconnect';
import { sortList } from '../utils';

const mapStateToProps = ({ walletconnect: { walletConnectors } }) => ({ walletConnectors });

export default Component => compose(
  connect(mapStateToProps, {
    getValidWalletConnectors,
    removeWalletConnectorByDapp,
    setWalletConnectors,
  }),
  withProps(({ walletConnectors }) => {
    const sortedWalletConnectors = sortList(Object.values(walletConnectors), 'expires');
    const sortedWalletConnectorsByDappName = groupBy(sortedWalletConnectors, 'dappName');
    const dappWalletConnector = mapValues(sortedWalletConnectorsByDappName, (connectors) => {
      const firstElement = head(connectors);
      return {
        dappName: firstElement.dappName,
        expires: firstElement.expires
      };
    });
    return {
      sortedWalletConnectors,
      walletConnectorsByDappName: values(dappWalletConnector),
      walletConnectorsCount: sortedWalletConnectors.length,
    };
  }),
)(Component);
