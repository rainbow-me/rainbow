import { getGlobal, saveGlobal } from './common';

const TOP_MOVERS = 'topMovers';

const topMoversVersion = '0.1.0';

export const getTopMovers = () => getGlobal(TOP_MOVERS, {}, topMoversVersion);

export const saveTopMovers = topMovers => saveGlobal(TOP_MOVERS, topMovers);
