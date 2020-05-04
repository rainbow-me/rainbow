import { useCallback, useEffect, useState } from 'react';
import { apiGetTopMovers } from '../handlers/topMovers';

export default function useTopMovers() {
  const [movers, setMovers] = useState({});

  const updateTopMovers = useCallback(async () => {
    const { gainers, losers } = await apiGetTopMovers();
    setMovers({ gainers, losers });
  }, []);

  useEffect(() => {
    updateTopMovers();
  }, [updateTopMovers]);

  return movers;
}
