import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '@rainbow-me/redux/store';

const sorterByTimestampInMs = (a: any, b: any) => {
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
  const { requests } = useSelector(({ requests: { requests } }: AppState) => ({
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
