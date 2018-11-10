import { compose, withProps } from 'recompact';
import { connect } from 'react-redux';
import {
  getValidWalletConnectors,
  removeWalletConnector,
  setWalletConnectors,
} from '../redux/walletconnect';
import { sortList } from '../utils';

const mapStateToProps = ({ walletconnect: { walletConnectors } }) => ({ walletConnectors });

export default Component => compose(
  connect(mapStateToProps, {
    getValidWalletConnectors,
    removeWalletConnector,
    setWalletConnectors,
  }),
  withProps(({ walletConnectors }) => {
    const sortedWalletConnectors = sortList(Object.values(walletConnectors), 'expires');

    return {
      walletConnectors: sortedWalletConnectors,
      walletConnectorsCount: sortedWalletConnectors.length,
    };
  }),
)(Component);
