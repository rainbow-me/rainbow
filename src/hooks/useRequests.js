import { useMemo } from 'react';
import { useSelector } from 'react-redux';

const sorterByTimestampInMs = (a, b) => {
  if (a?.displayDetails?.timestampInMs < b?.displayDetails?.timestampInMs) {
    return 1;
  } else if (
    a?.displayDetails?.timestampInMs > b?.displayDetails?.timestampInMs
  ) {
    return -1;
  } else {
    return 0;
  }
};

export default function useRequests() {
  const { requests } = useSelector(({ requests: { requests } }) => ({
    requests,
  }));

  const { pendingRequestCount, sortedRequests } = useMemo(() => {
    const sortedRequests = Object.values(requests).sort(sorterByTimestampInMs);

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
