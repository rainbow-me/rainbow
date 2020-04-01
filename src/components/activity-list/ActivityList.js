import PropTypes from 'prop-types';
import React from 'react';
import { withNavigationFocus } from 'react-navigation';
import { compose, onlyUpdateForKeys, withProps } from 'recompact';
import networkTypes from '../../helpers/networkTypes';
import { buildTransactionsSectionsSelector } from '../../helpers/transactions';
import {
  withAccountSettings,
  withAccountTransactions,
  withContacts,
  withRequests,
} from '../../hoc';
import RecyclerActivityList from './RecyclerActivityList';
import TestnetEmptyState from './TestnetEmptyState';

const ActivityList = ({
  accountAddress,
  accountColor,
  accountName,
  header,
  isEmpty,
  navigation,
  sections,
  network,
}) =>
  network === networkTypes.mainnet || sections.length ? (
    <RecyclerActivityList
      accountAddress={accountAddress}
      accountColor={accountColor}
      accountName={accountName}
      navigation={navigation}
      isEmpty={isEmpty}
      header={header}
      isLoading={!isEmpty && !sections.length}
      sections={sections}
    />
  ) : (
    <TestnetEmptyState>{header}</TestnetEmptyState>
  );

ActivityList.propTypes = {
  accountAddress: PropTypes.string,
  accountColor: PropTypes.number,
  accountName: PropTypes.string,
  header: PropTypes.node,
  isEmpty: PropTypes.bool,
  navigation: PropTypes.object,
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      data: PropTypes.array,
      renderItem: PropTypes.func,
      title: PropTypes.string.isRequired,
    })
  ),
};

export default compose(
  withAccountSettings,
  withAccountSettings,
  withAccountTransactions,
  withContacts,
  withNavigationFocus,
  withRequests,
  withProps(buildTransactionsSectionsSelector),
  onlyUpdateForKeys([
    'initialized',
    'isFocused',
    'network',
    'contacts',
    'isEmpty',
    'nativeCurrency',
    'pendingTransactionsCount',
    'sections',
    'accountName',
    'accountColor',
  ])
)(ActivityList);
