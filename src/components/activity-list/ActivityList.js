import PropTypes from 'prop-types';
import React from 'react';
import { compose, mapProps, onlyUpdateForKeys, withProps } from 'recompact';
import { buildTransactionsSectionsSelector } from '../../helpers/transactions';
import networkTypes from '../../helpers/networkTypes';
import {
  withAccountSettings,
  withAccountTransactions,
  withContacts,
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
  withAccountTransactions,
  withContacts,
  withNavigationFocus,
  withProps(buildTransactionsSectionsSelector),
  mapProps(({ nativeCurrency, requests, sections, ...props }) => {
    let pendingTransactionsCount = 0;

    const pendingTxSection = sections[requests.length ? 1 : 0];

    if (pendingTxSection && pendingTxSection.title === 'Pending') {
      pendingTransactionsCount = pendingTxSection.data.length;
    }
    return {
      ...props,
      nativeCurrency,
      pendingTransactionsCount,
      sections,
    };
  }),
  onlyUpdateForKeys([
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
