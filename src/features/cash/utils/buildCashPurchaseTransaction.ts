import { buildTransactionTitle, TransactionDirection, TransactionStatus, type RainbowTransaction } from '@/entities/transactions';
import { supportedCurrencies } from '@/features/currency/supportedCurrencies';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { convertAmountToRawAmount, convertRawAmountToBalance } from '@/helpers/utilities';
import { getUniqueId } from '@/utils/ethereumUtils';
import getUrlForTrustIconFallback from '@/utils/getUrlForTrustIconFallback';

import { CASH_USDC_BY_NETWORK, USDC_DECIMALS, USDC_NAME, USDC_SYMBOL } from '../constants';
import { RampError, type BuyOrder, type OrderStatus } from '../services/rampClient';

type CompletedBuyOrder = Extract<BuyOrder, { status: OrderStatus.Completed }>;

export function buildCashPurchaseTransaction({
  order,
  walletAddress,
}: {
  order: CompletedBuyOrder;
  walletAddress: string;
}): RainbowTransaction {
  const status = TransactionStatus.pending;

  const { network: rampNetwork } = order.cryptoAmount.asset;
  const usdc = CASH_USDC_BY_NETWORK[rampNetwork];
  if (!usdc) throw new RampError(`Unsupported ramp network: ${rampNetwork}`);

  const { address } = usdc;
  const { getChainsIdByName, getChainsName } = useBackendNetworksStore.getState();
  const chainId = getChainsIdByName()[usdc.chainName];
  if (!chainId) throw new RampError(`Missing backend chain id mapping for: ${usdc.chainName}`);
  const network = getChainsName()[chainId];
  if (!network) throw new RampError(`Missing backend chain name mapping for chainId: ${String(chainId)}`);
  const fiatSymbol = supportedCurrencies[order.fiatAmount.currency as keyof typeof supportedCurrencies]?.symbol ?? '';
  const rawCryptoAmount = convertAmountToRawAmount(order.cryptoAmount.amount, USDC_DECIMALS);
  const asset = {
    address,
    balance: convertRawAmountToBalance(rawCryptoAmount, { decimals: USDC_DECIMALS, symbol: USDC_SYMBOL }),
    chainId,
    decimals: USDC_DECIMALS,
    icon_url: getUrlForTrustIconFallback(address, chainId) ?? undefined,
    name: USDC_NAME,
    network,
    price: {
      value: 1,
    },
    symbol: USDC_SYMBOL,
    uniqueId: getUniqueId(address, chainId),
  };

  return {
    amount: order.cryptoAmount.amount,
    asset,
    chainId,
    changes: [
      {
        address_to: walletAddress,
        asset,
        direction: TransactionDirection.IN,
        price: 1,
        value: rawCryptoAmount,
      },
    ],
    description: `${fiatSymbol}${order.fiatAmount.amount}`,
    direction: TransactionDirection.IN,
    from: null,
    hash: order.transactionHash,
    network,
    nonce: null,
    status,
    title: buildTransactionTitle('purchase', status),
    to: walletAddress,
    type: 'purchase',
  };
}
