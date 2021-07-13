import analytics from '@segment/analytics-react-native';
import { isNil, keys } from 'lodash';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import logger from 'logger';

export default function usePortfolios() {
  const portfolios = useSelector(({ data: { portfolios } }) => portfolios);

  const trackPortfolios = useCallback(() => {
    const total = {
      assets_value: 0,
      borrowed_value: 0,
      bsc_assets_value: 0,
      deposited_value: 0,
      locked_value: 0,
      polygon_assets_value: 0,
      staked_value: 0,
      total_value: 0,
    };
    keys(portfolios).forEach(address => {
      keys(portfolios[address]).forEach(key => {
        if (!isNil(total[key])) {
          total[key] += portfolios[address][key];
        }
      });
    });
    logger.log('💰 wallet totals', JSON.stringify(total, null, 2));
    keys(total).forEach(key => {
      const data = { [key]: total[key] };
      analytics.identify(null, data);
    });
  }, [portfolios]);

  return {
    portfolios,
    trackPortfolios,
  };
}
