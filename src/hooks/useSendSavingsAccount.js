import { get, map } from 'lodash';
import { convertAmountToNativeDisplay, multiply } from '../helpers/utilities';
import { formatDepositAmount } from '../helpers/savings';
import {
  useAccountAssets,
  useAccountSettings,
  useSavingsAccount,
} from '../hooks';
import { ethereumUtils } from '../utils';

export default function useSendSavingsAccount() {
  const { allAssets } = useAccountAssets();
  const { nativeCurrency } = useAccountSettings();
  let savings = useSavingsAccount();
  const eth = ethereumUtils.getAsset(allAssets);
  const priceOfEther = get(eth, 'native.price.amount', null);
  if (priceOfEther) {
    savings = map(savings, asset => {
      const { cToken, cTokenBalance, exchangeRate, underlyingPrice } = asset;
      const cTokenBalanceDisplay = formatDepositAmount(
        cTokenBalance,
        cToken.symbol,
        false
      );

      const underlyingNativePrice = multiply(underlyingPrice, priceOfEther);
      const cTokenNativePrice = multiply(exchangeRate, underlyingNativePrice);
      const cTokenNativePriceDisplay = convertAmountToNativeDisplay(
        cTokenNativePrice,
        nativeCurrency
      );
      const balanceNativeValue = multiply(cTokenBalance, cTokenNativePrice);
      const balanceNativeDisplay = convertAmountToNativeDisplay(
        balanceNativeValue,
        nativeCurrency
      );

      return {
        ...asset,
        ...cToken,
        balance: {
          amount: cTokenBalance,
          display: cTokenBalanceDisplay,
        },
        native: {
          balance: {
            amount: balanceNativeValue,
            display: balanceNativeDisplay,
          },
        },
        price: {
          display: cTokenNativePriceDisplay,
          value: cTokenNativePrice,
        },
      };
    });
  }
  return savings;
}
