import { reverse, sortBy, values } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function useRequests() {
  const { requests } = useSelector(({ requests: { requests } }) => ({
    requests,
  }));

  const { pendingRequestCount, sortedRequests } = useMemo(() => {
    const sortedRequests = reverse(
      sortBy(values(requests), 'displayDetails.timestampInMs')
    );

    return {
      pendingRequestCount: sortedRequests.length,
      sortedRequests,
    };
  }, [requests]);

  return {
    pendingRequestCount,
    requests: sortedRequests,
  };
}
