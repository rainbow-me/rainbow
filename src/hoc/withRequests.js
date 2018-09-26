import {
  reverse,
  sortBy,
  values
} from 'lodash';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';

const mapStateToProps = ({ transactionsToApprove: { transactionsToApprove } }) => ({
  requests: transactionsToApprove,
});

export default Component => compose(
  connect(mapStateToProps),
  withProps(({ requests }) => {
    const sortedTransactions = reverse(sortBy(values(requests), 'transactionPayload.timestamp'));
    return {
      pendingRequestCount: sortedTransactions.length,
      requests: sortedTransactions,
    }
  }),
)(Component);
