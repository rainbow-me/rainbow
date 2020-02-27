import { useSelector } from 'react-redux';
import useAccountAssets from './useAccountAssets';
import useAccountSettings from './useAccountSettings';
import useSavingsAccount from './useSavingsAccount';
import useUniqueTokens from './useUniqueTokens';
import useUniswapLiquidityTokenInfo from './useUniswapLiquidityTokenInfo';
import { buildWalletSectionsSelector } from '../helpers/buildWalletSections';
import { setIsWalletEmpty } from '../redux/isWalletEmpty';

export default function useWalletSectionsData() {
  const empties = useSelector(({ isWalletEmpty, isWalletEthZero }) => ({
    isWalletEmpty,
    isWalletEthZero,
  }));

  const accountData = useAccountAssets();
  const accountSavings = useSavingsAccount();
  const accountSettings = useAccountSettings();
  const uniqueTokens = useUniqueTokens();
  const uniswap = useUniswapLiquidityTokenInfo();
  console.log('GOT SAVINGS', accountSavings);

  const accountInfo = {
    ...accountData,
    ...accountSettings,
    ...uniqueTokens,
    ...uniswap,
    ...empties,
    savings: accountSavings,
    setIsWalletEmpty,
  };
  return Object.assign(accountInfo, buildWalletSectionsSelector(accountInfo));
}
