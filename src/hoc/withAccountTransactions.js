import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';

const transactionsSelector = state => state.transactions;

const mapStateToProps = ({ data: { transactions } }) => ({
  transactions,
});

const transactionsCountSelector = createSelector(
  [transactionsSelector],
  transactions => ({ transactionsCount: transactions.length })
);

export default Component =>
  compose(
    connect(mapStateToProps),
    withProps(transactionsCountSelector)
  )(Component);
