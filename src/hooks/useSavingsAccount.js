import { concat, find } from 'lodash';
import { useSelector } from 'react-redux';
import { DAI_ADDRESS } from '../references';

export default function useSavingsAccount(includeDefaultDai) {
  const { accountTokens, daiMarketData } = useSelector(({ savings }) => ({
    accountTokens: savings.accountTokens,
    daiMarketData: savings.daiMarketData,
  }));

  const accountHasCDAI = find(
    accountTokens,
    token => token.underlying.address === DAI_ADDRESS
  );

  let tokens = accountTokens;

  const shouldAddDai = includeDefaultDai && !accountHasCDAI && daiMarketData;
  if (shouldAddDai) {
    tokens = concat(accountTokens, {
      ...daiMarketData,
    });
  }
  return tokens;
}
