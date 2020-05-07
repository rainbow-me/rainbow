import { getGlobal, saveGlobal } from './common';

// Key used for loading the cache with data from storage
export const TOP_MOVERS_FROM_STORAGE = 'topMoversFromStorage';

const TOP_MOVERS = 'topMovers';

const topMoversVersion = '0.1.0';

export const getTopMovers = () => getGlobal(TOP_MOVERS, {}, topMoversVersion);

export const saveTopMovers = topMovers => saveGlobal(TOP_MOVERS, topMovers);
