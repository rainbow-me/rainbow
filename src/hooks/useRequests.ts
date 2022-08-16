import reverse from 'lodash/reverse';
import sortBy from 'lodash/sortBy';
import values from 'lodash/values';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '@rainbow-me/redux/store';

export default function useRequests() {
  const { requests } = useSelector(({ requests: { requests } }: AppState) => ({
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
