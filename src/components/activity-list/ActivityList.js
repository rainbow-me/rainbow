import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForKeys, withProps } from 'recompact';
import { buildTransactionsSectionsSelector } from '../../helpers/transactions';
import networkTypes from '../../helpers/networkTypes';
import {
  withAccountSettings,
  withAccountTransactions,
  withContacts,
  withRequests,
} from '../../hoc';
import RecyclerActivityList from './RecyclerActivityList';
import TestnetEmptyState from './TestnetEmptyState';
import { withNavigationFocus } from 'react-navigation';

const ActivityList = ({ header, isEmpty, sections, network }) =>
  network === networkTypes.mainnet || sections.length ? (
    <RecyclerActivityList
      header={header}
      isLoading={!isEmpty && !sections.length}
      sections={sections}
    />
  ) : (
    <TestnetEmptyState>{header}</TestnetEmptyState>
  );

ActivityList.propTypes = {
  header: PropTypes.node,
  isEmpty: PropTypes.bool,
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
