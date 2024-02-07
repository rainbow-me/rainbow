import { ActivityItem } from '@ratio.me/ratio-react-native-library';

import { NewTransactionOrAddCashTransaction, TransactionStatus, TransactionType } from '@/entities';
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

export function parseRatioCurrency(currency: string | `${string}_${string}`) {
  const [token] = currency.split('_') as [string, string | undefined];
  return token;
}

export async function ratioOrderToNewTransaction({
  userId,
  activity,
  analyticsSessionId,
}: {
  userId: string;
  activity: ActivityItem;
  analyticsSessionId: string;
}): Promise<NewTransactionOrAddCashTransaction> {
  const parsedCurrency = parseRatioCurrency(activity.crypto.currency);
  const parsedNetwork = parseRatioNetworkToInternalNetwork(activity.crypto.wallet.network);

  if (!parsedNetwork) {
    logger.debug(`Ratio: could not determine network`, {
      rawNetwork: activity.crypto.wallet.network,
      parsedNetwork,
    });

    throw new RainbowError(`Ratio: could not determine network`);
  }

  const destAssetAddress = AddCashCurrencies[parsedNetwork]?.[parsedCurrency]?.toLowerCase();

  if (!destAssetAddress) {
    logger.debug(`Ratio: could not determine asset address`, {
      rawNetwork: activity.crypto.wallet.network,
      parsedNetwork,
      rawCurrency: activity.crypto.currency,
      parsedCurrency,
    });

    throw new RainbowError(`Ratio: could not determine asset address`);
  }

  const asset = await ethereumUtils.getNativeAssetForNetwork(parsedNetwork, destAssetAddress);

  if (!asset) {
    logger.debug(`Ratio: could not get account asset`, {
      rawNetwork: activity.crypto.wallet.network,
      parsedNetwork,
      rawCurrency: activity.crypto.currency,
      parsedCurrency,
      destAssetAddress,
    });

    throw new RainbowError(`Ratio: could not get account asset`);
  }

  return {
    amount: activity.crypto.amount,
    asset,
    from: null,
    hash: null,
    nonce: null,
    sourceAmount: `${activity.fiat.amount} ${activity.fiat.currency}`,
    status: TransactionStatus.purchasing,
    timestamp: Date.now(),
    to: activity.crypto.wallet.address,
    type: TransactionType.purchase,
    fiatProvider: {
      name: FiatProviderName.Ratio,
      orderId: activity.id,
      userId: userId,
      analyticsSessionId: analyticsSessionId,
    },
  };
}
