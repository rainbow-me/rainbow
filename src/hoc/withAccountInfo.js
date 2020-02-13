import { toLower } from 'lodash';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompose';
import { createSelector } from 'reselect';
import {
  settingsUpdateAccountAddress,
  settingsUpdateAccountColor,
  settingsUpdateAccountName,
} from '../redux/settings';

const mapStateToProps = ({
  settings: { accountAddress, accountColor, accountName },
}) => ({ accountAddress, accountColor, accountName });

const accountAddressSelector = state => state.accountAddress;

const lowerAccountAddressSelector = createSelector(
  [accountAddressSelector],
  accountAddress => ({ accountAddress: toLower(accountAddress) })
);

export default Component =>
  compose(
    connect(mapStateToProps, {
      settingsUpdateAccountAddress,
      settingsUpdateAccountColor,
      settingsUpdateAccountName,
    }),
    withProps(lowerAccountAddressSelector)
  )(Component);
