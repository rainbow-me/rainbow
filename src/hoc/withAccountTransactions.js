import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';

const transactionsSelector = state => {
  console.log(state.transactions)
  const rehash = (id) =>  {
    return state.transactions.map(t => ({ hash: t.hash + id, ...t }));
  }
  return [...state.transactions, ...rehash('A'), ...rehash('B'), ...rehash('C'), ...rehash('D'), ...rehash('E')];
}

const mapStateToProps = ({
  transactions: {
    hasPendingTransaction,
    transactions,
  },
}) => ({
  hasPendingTransaction,
  transactions,
});

const transactionsCountSelector = createSelector(
  [transactionsSelector],
  (transactions) => ({ transactionsCount: transactions.length * 6 }),
);

export default Component => compose(
  connect(mapStateToProps),
  withProps(transactionsCountSelector),
)(Component);
