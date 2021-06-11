import { getGlobal, saveGlobal } from './common';

export const TOP_GAINERS = 'topGainers';
export const TOP_LOSERS = 'topLosers';

export const getTopMovers = async () => {
  const gainers = await getGlobal(TOP_GAINERS, []);
  const losers = await getGlobal(TOP_LOSERS, []);
  return {
    gainers,
    losers,
  };
};

export const saveTopGainers = gainers => saveGlobal(TOP_GAINERS, gainers);
export const saveTopLosers = losers => saveGlobal(TOP_LOSERS, losers);
