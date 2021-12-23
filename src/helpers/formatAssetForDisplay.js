import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { PaymentTokens } from '@rainbow-me/utils/tokenHistoryUtils';

export default function formatAssetForDisplay({ amount, token }) {
  let price = 0;

  switch (token) {
    case PaymentTokens.ETH:
    case PaymentTokens.WETH:
    case PaymentTokens.DAI:
      price = formatUnits(BigNumber.from(amount), 18);
      break;
    case PaymentTokens.USDC:
      price = formatUnits(BigNumber.from(amount), 6);
      break;
    default:
      break;
  }

  return String(price);
}
