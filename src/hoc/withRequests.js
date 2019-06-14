import { reverse, sortBy, values } from 'lodash';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';

const mapStateToProps = ({ requests: { requests } }) => ({
  requests,
});

const requestsSelector = state => state.requests;

const withRequests = (requests) => {
  const sortedRequests = reverse(sortBy(values(requests), 'displayDetails.timestampInMs'));

  return {
    pendingRequestCount: sortedRequests.length,
    requests: sortedRequests,
  };
};

const withRequestsSelector = createSelector(
  [requestsSelector],
  withRequests,
);

export default Component => compose(
  connect(mapStateToProps),
  withProps(withRequestsSelector),
)(Component);
