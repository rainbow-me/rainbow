import analytics from '@segment/analytics-react-native';
import { isNil, keys } from 'lodash';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

export default function usePortfolios() {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
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
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        if (!isNil(total[key])) {
          // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          total[key] += portfolios[address][key];
        }
      });
    });
    logger.log('💰 wallet totals', JSON.stringify(total, null, 2));
    keys(total).forEach(key => {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      const data = { [key]: total[key] };
      analytics.identify(null, data);
    });
  }, [portfolios]);

  return {
    portfolios,
    trackPortfolios,
  };
}
