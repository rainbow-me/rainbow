import { reverse, sortBy, values } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function useRequests() {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'requests' does not exist on type 'Defaul... Remove this comment to see the full error message
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
