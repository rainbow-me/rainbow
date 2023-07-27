import { BigNumberish } from '@ethersproject/bignumber';
import { ProtocolType } from '../protocolTypes';
import { ParsedAddressAsset } from '../tokens';
import { EthereumAddress } from '../wallet';
import { TransactionStatus } from './transactionStatus';
import { TransactionType } from './transactionType';
import { Network } from '@/helpers/networkTypes';
import { AddCashCurrencyAsset } from '@/references';
import { ChainId, SwapType } from '@rainbow-me/swaps';
import { SwapMetadata } from '@/raps/common';
import { FiatProviderName } from '@/entities/f2c';
import { UniqueAsset } from '../uniqueAssets';

export interface RainbowTransaction {
  address?: string;
  balance?: {
    amount: string;
    display: string;
  } | null;
  dappName?: string; // for walletconnect
  data?: string; // for pending tx
  description?: string | null;
  from: EthereumAddress | null;
  gasLimit?: BigNumberish;
  gasPrice?: BigNumberish;
  maxFeePerGas?: BigNumberish;
  maxPriorityFeePerGas?: BigNumberish;
  hash?: string | null;
  minedAt?: number | null;
  name?: string | null;
  native?: {
    amount: string;
    display: string;
  };
  network?: Network;
  nft?: UniqueAsset;
  nonce?: number | null;
  pending?: boolean;
  protocol?: ProtocolType | null;
  flashbots?: boolean;
  ensCommitRegistrationName?: string;
  ensRegistration?: boolean;
  sourceAmount?: string; // for purchases
  status?: TransactionStatus;
  swap?: {
    type: SwapType;
    toChainId: ChainId;
    fromChainId: ChainId;
    isBridge: boolean;
  };
  symbol?: string | null;
  timestamp?: number; // for purchases
  title?: string;
  to: EthereumAddress | null;
  transferId?: string; // for purchases
  txTo?: EthereumAddress | null;
  type?: TransactionType;
  value?: BigNumberish; // for pending tx
  fee?: RainbowTransactionFee;
  fiatProvider?: {
    name: FiatProviderName.Ratio;
    orderId: string;
    userId: string;
    /**
     * Required for all providers, used to associate requests with transaction
     * data once we receive it.
     */
    analyticsSessionId: string;
  }; // etc { name: FiatProviderName.Ramp, orderId: string }
}

export interface RainbowTransactionFee {
  value: {
    amount: string;
    display: string;
  };
  native?: {
    amount: string;
    display: string;
  };
}

export interface NewTransaction {
  amount: string | null;
  asset: ParsedAddressAsset | null;
  dappName?: string; // for walletconnect
  data?: string;
  from: EthereumAddress | null;
  gasLimit?: BigNumberish;
  gasPrice?: BigNumberish;
  maxFeePerGas?: BigNumberish;
  maxPriorityFeePerGas?: BigNumberish;
  hash: string | null;
  network?: Network;
  nft?: UniqueAsset;
  nonce: number | null;
  protocol?: ProtocolType | null;
  flashbots?: boolean;
  ensCommitRegistrationName?: string;
  ensRegistration?: boolean;
  sourceAmount?: string; // for purchases
  status?: TransactionStatus;
  timestamp?: number; // for purchases
  to: EthereumAddress | null;
  transferId?: string; // for purchases
  type?: TransactionType;
  value?: BigNumberish;
  txTo?: EthereumAddress | null;
  swap?: {
    type: SwapType;
    fromChainId: ChainId;
    toChainId: ChainId;
    isBridge: boolean;
  };
  meta?: SwapMetadata;
  fiatProvider?: RainbowTransaction['fiatProvider'];
}

export interface NewTransactionOrAddCashTransaction
  extends Omit<NewTransaction, 'asset'> {
  // Although the type of `asset` really represents
  // `ParsedAddressAsset | AddCashCurrencyAsset | null`, it is more
  // convenient for typing purposes to use
  // `Partial<ParsedAddressAsset> & AddCashCurrencyAsset` with the implication
  // that all of the `ParsedAddressAsset` fields would be undefined.
  // Statements such as `transaction?.asset?.price?.value` would fail to
  // compile without the partial since `AddCashCurrencyAsset` does not have the
  // key `price`, even though the statement is safe.
  asset:
    | ParsedAddressAsset
    | (Partial<ParsedAddressAsset> & AddCashCurrencyAsset)
    | null;
}

export type MinimalTransactionDetails = Pick<
  RainbowTransaction,
  'minedAt' | 'hash' | 'type' | 'network' | 'from' | 'pending' | 'to' | 'status'
>;
