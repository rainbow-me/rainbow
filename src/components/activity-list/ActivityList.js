import PropTypes from 'prop-types';
import React from 'react';
import {
  compose,
  mapProps,
  onlyUpdateForKeys,
  withProps,
} from 'recompact';
import { buildTransactionsSectionsSelector } from '../../helpers/transactions';
import {
  withAccountAddress,
  withAccountSettings,
  withAccountTransactions,
} from '../../hoc';
import RecyclerActivityList from './RecyclerActivityList';

const ActivityList = ({
  hasPendingTransaction,
  header,
  nativeCurrency,
  pendingTransactionsCount,
  sections,
}) => (
  <RecyclerActivityList
    sections={sections}
    header={header}
  />
);

ActivityList.propTypes = {
  hasPendingTransaction: PropTypes.bool,
  header: PropTypes.node,
  nativeCurrency: PropTypes.string.isRequired,
  pendingTransactionsCount: PropTypes.number,
  sections: PropTypes.arrayOf(PropTypes.shape({
    data: PropTypes.array,
    renderItem: PropTypes.func,
    title: PropTypes.string.isRequired,
  })),
  transactionsCount: PropTypes.number,
};

export default compose(
  withAccountAddress,
  withAccountSettings,
  withAccountTransactions,
  withProps(buildTransactionsSectionsSelector),
  mapProps(({
    nativeCurrency,
    requests,
    sections,
    ...props
  }) => {
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
    'hasPendingTransaction',
    'nativeCurrency',
    'pendingTransactionsCount',
    'sections',
  ]),
)(ActivityList);
