import { map } from 'lodash';
import { convertAmountToNativeDisplay, multiply } from '../helpers/utilities';
import useAccountSettings from './useAccountSettings';
import useSavingsAccount from './useSavingsAccount';
import { Network } from '@rainbow-me/helpers';

export default function useSendSavingsAccount() {
  const { nativeCurrency, network: currentNetwork } = useAccountSettings();
  let { savings } = useSavingsAccount();
  if (currentNetwork !== Network.mainnet) return;
  savings = map(savings, asset => {
    const { cToken, cTokenBalance, exchangeRate, underlyingPrice } = asset;
    const cTokenBalanceDisplay = `${cTokenBalance} ${cToken.symbol}`;

    const cTokenNativePrice = multiply(exchangeRate, underlyingPrice);
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
  return savings;
}
