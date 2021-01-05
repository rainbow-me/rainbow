import { map } from 'lodash';
import { useSelector } from 'react-redux';
import { convertAmountToNativeDisplay, multiply } from '../helpers/utilities';
import useAccountSettings from './useAccountSettings';
import useSavingsAccount from './useSavingsAccount';
import { ethereumUtils } from '@rainbow-me/utils';

export default function useSendSavingsAccount() {
  const { nativeCurrency } = useAccountSettings();
  let { savings } = useSavingsAccount();
  const { genericAssets } = useSelector(({ data: { genericAssets } }) => ({
    genericAssets,
  }));
  const priceOfEther = ethereumUtils.getEthPriceUnit(genericAssets);
  if (priceOfEther) {
    savings = map(savings, asset => {
      const { cToken, cTokenBalance, exchangeRate, underlyingPrice } = asset;
      const cTokenBalanceDisplay = `${cTokenBalance} ${cToken.symbol}`;

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
