import { connect } from 'react-redux';
import { compose, withProps } from 'recompose';
import { createSelector } from 'reselect';
import { settingsUpdateAccountAddress } from '../redux/settings';

const mapStateToProps = ({ settings: { accountAddress } }) => ({ accountAddress });

const accountAddressSelector = state => state.accountAddress;

const lowerAccountAddressSelector = createSelector(
  [accountAddressSelector],
  (accountAddress) => ({ accountAddress: accountAddress.toLowerCase() }),
);

export default Component => compose(
  connect(mapStateToProps, { settingsUpdateAccountAddress }),
  withProps(lowerAccountAddressSelector),
)(Component);
