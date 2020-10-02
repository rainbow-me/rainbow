import { toLower } from 'lodash';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import {
  settingsUpdateAccountColor,
  settingsUpdateAccountName,
} from '../redux/settings';
import { connect } from '@rainbow-me/react-redux';

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
      settingsUpdateAccountColor,
      settingsUpdateAccountName,
    }),
    withProps(lowerAccountAddressSelector)
  )(Component);
