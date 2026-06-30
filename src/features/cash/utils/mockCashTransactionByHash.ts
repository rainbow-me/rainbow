import { TransactionStatus, type RainbowTransaction } from '@/entities/transactions';
import { type NativeCurrencyKey } from '@/features/currency/types';
import { backendNetworksActions } from '@/features/network/stores/backendNetworksStore';
import { type ChainId } from '@/features/network/types/backendNetworks';
import {
  type Asset,
  type GetTransactionByHashResponse,
  type Transaction,
} from '@/features/positions/types/generated/transaction/transaction';
import { time } from '@/framework/core/utils/time';
import { convertAmountToRawAmount } from '@/helpers/utilities';
import { parseTransaction } from '@/parsers/transactions';

const MOCK_CASH_TRANSACTION_HASH_PREFIX = 'mock-tx-';
const MOCK_CASH_USDC_ADDRESS = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const MOCK_CASH_USDC_AMOUNT = '25';
const MOCK_CASH_USDC_DECIMALS = 6;

export async function getMockCashTransactionByHash({
  address,
  currency,
  chainId,
  hash,
}: {
  address: string;
  currency: NativeCurrencyKey;
  chainId: ChainId;
  hash: string;
}): Promise<RainbowTransaction | null> {
  if (!hash.startsWith(MOCK_CASH_TRANSACTION_HASH_PREFIX)) return Promise.resolve(null);

  const network = backendNetworksActions.getChainsName()[chainId] || 'base';
  const rawAmount = convertAmountToRawAmount(MOCK_CASH_USDC_AMOUNT, MOCK_CASH_USDC_DECIMALS);
  const response: GetTransactionByHashResponse = {
    errors: [],
    metadata: undefined,
    result: {
      addressFrom: '0x0000000000000000000000000000000000000000',
      addressTo: address,
      blockConfirmations: 1,
      blockNumber: 1,
      callData: new Uint8Array(),
      chainId: String(chainId),
      changes: [
        {
          addressFrom: '0x0000000000000000000000000000000000000000',
          addressTo: address,
          asset: buildMockUsdcAsset({ chainId, network }),
          direction: 'in',
          price: '1',
          quantity: rawAmount,
          value: rawAmount,
        },
      ],
      direction: 'in',
      fee: undefined,
      hash,
      id: hash,
      meta: {
        action: 'Purchased',
        approvalTo: '',
        asset: buildMockUsdcAsset({ chainId, network }),
        contractIconUrl: '',
        contractName: '',
        explorerLabel: '',
        explorerUrl: '',
        fourbyte: '',
        publicSubType: '',
        quantity: MOCK_CASH_USDC_AMOUNT,
        subType: '',
        type: 'purchase',
      },
      minedAt: new Date(),
      network,
      nonce: -2,
      status: TransactionStatus.confirmed,
      type: 'purchase',
    },
  };

  await new Promise(resolve => {
    setTimeout(resolve, time.seconds(5));
  });
  return parseTransaction(response.result as Transaction, currency, chainId);
}

function buildMockUsdcAsset({ chainId, network }: { chainId: ChainId; network: string }): Asset {
  return {
    assetCode: MOCK_CASH_USDC_ADDRESS,
    bridging: undefined,
    chainId: String(chainId),
    colors: undefined,
    creationDate: undefined,
    decimals: 6,
    defiPosition: false,
    hasTransferable: true,
    iconUrl: '',
    interface: 'ERC20',
    name: 'USD Coin',
    network,
    networks: [
      {
        chainId: String(chainId),
        tokenMapping: {
          address: MOCK_CASH_USDC_ADDRESS,
          decimals: 6,
        },
      },
    ],
    price: {
      changedAt: new Date(),
      relativeChange24h: '0',
      value: '1',
    },
    probableSpam: false,
    symbol: 'USDC',
    tokenId: '',
    transferable: true,
    trash: false,
    type: 'erc20',
    verified: true,
  };
}
