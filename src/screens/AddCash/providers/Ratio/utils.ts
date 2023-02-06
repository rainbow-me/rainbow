import { RatioOrderStatus } from '@ratio.me/ratio-react-native-library';

import {
  NewTransactionOrAddCashTransaction,
  TransactionStatus,
  TransactionType,
} from '@/entities';
import { AddCashCurrencies } from '@/references';
import { ethereumUtils } from '@/utils';
import { logger, RainbowError } from '@/logger';
import { FiatProviderName } from '@/entities/f2c';
import { Network } from '@/helpers';

export function parseRatioNetworkToInternalNetwork(network: string) {
  switch (network) {
    case 'ETHEREUM':
      return Network.mainnet;
    case 'POLYGON':
      return Network.polygon;
    default:
      return undefined;
  }
}

export function parseRationCurrency(currency: string | `${string}_${string}`) {
  const [token] = currency.split('_') as [string, string | undefined];
  return token;
}

export async function ratioOrderToNewTransaction(
  order: RatioOrderStatus,
  extra: {
    analyticsSessionId: string;
  }
): Promise<NewTransactionOrAddCashTransaction> {
  const { data } = order;
  const parsedCurrency = parseRationCurrency(data.activity.crypto.currency);
  const parsedNetwork = parseRatioNetworkToInternalNetwork(
    data.activity.crypto.wallet.network
  );

  if (!parsedNetwork) {
    logger.debug(`Ratio: could not determine network`, {
      rawNetwork: data.activity.crypto.wallet.network,
      parsedNetwork,
    });

    throw new RainbowError(`Ratio: could not determine network`);
  }

  const destAssetAddress = AddCashCurrencies[parsedNetwork]?.[
    parsedCurrency
  ]?.toLowerCase();

  if (!destAssetAddress) {
    logger.debug(`Ratio: could not determine asset address`, {
      rawNetwork: data.activity.crypto.wallet.network,
      parsedNetwork,
      rawCurrency: data.activity.crypto.currency,
      parsedCurrency,
    });

    throw new RainbowError(`Ratio: could not determine asset address`);
  }

  // TODO if account doesn't have this token, we fail here I.e. new wallets
  const asset = await ethereumUtils.getNativeAssetForNetwork(
    parsedNetwork,
    destAssetAddress
  );

  if (!asset) {
    logger.debug(`Ratio: could not get account asset`, {
      rawNetwork: data.activity.crypto.wallet.network,
      parsedNetwork,
      rawCurrency: data.activity.crypto.currency,
      parsedCurrency,
      destAssetAddress,
    });

    throw new RainbowError(`Ratio: could not get account asset`);
  }

  return {
    amount: data.activity.crypto.amount,
    asset,
    from: null,
    hash: null,
    nonce: null,
    sourceAmount: `${data.activity.fiat.amount} ${data.activity.fiat.currency}`,
    status: TransactionStatus.purchasing,
    timestamp: Date.now(),
    to: data.activity.crypto.wallet.address,
    type: TransactionType.purchase,
    fiatProvider: {
      name: FiatProviderName.Ratio,
      orderId: data.activity.id,
      userId: data.userId,
      analyticsSessionId: extra.analyticsSessionId,
    },
  };
}
