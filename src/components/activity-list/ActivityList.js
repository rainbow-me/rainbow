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
  sections: PropTypes.arrayOf(PropTypes.shape({
    data: PropTypes.array,
    renderItem: PropTypes.func,
    title: PropTypes.string.isRequired,
  })),
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
    'isEmpty',
    'nativeCurrency',
    'pendingTransactionsCount',
    'sections',
  ]),
)(ActivityList);
