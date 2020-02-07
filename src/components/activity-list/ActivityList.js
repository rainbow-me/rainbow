import PropTypes from 'prop-types';
import React from 'react';
import {
  compose,
  mapProps,
  onlyUpdateForKeys,
  withProps,
  shouldUpdate,
} from 'recompact';
import { buildTransactionsSectionsSelector } from '../../helpers/transactions';
import {
  withAccountSettings,
  withAccountTransactions,
  withContacts,
} from '../../hoc';
import RecyclerActivityList from './RecyclerActivityList';

const ActivityList = ({ header, isEmpty, sections }) => (
  <RecyclerActivityList
    header={header}
    isLoading={!isEmpty && !sections.length}
    sections={sections}
  />
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
    'contacts',
    'isEmpty',
    'nativeCurrency',
    'pendingTransactionsCount',
    'sections',
    'header',
  ]),
  shouldUpdate((props, nextProps) => {
    return nextProps.shouldUpdate;
  })
)(ActivityList);
