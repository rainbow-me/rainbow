import { FiatProviderName } from '@/entities/f2c';

export enum Network {
  Ethereum = 'ethereum',
  Polygon = 'polygon',
  Optimism = 'optimism',
  Arbitrum = 'arbitrum',
  Solana = 'solana',
  Cardano = 'cardano',
  Cosmos = 'cosmos',
  Avalanche = 'avalanche',
  Ronin = 'ronin',
  Base = 'base',
  BitcoinCash = 'bitcoin_cash',
  BSC = 'bsc',
  BNBChain = 'bnb_chain',
  Bitcoin = 'bitcoin',
  Celo = 'celo',
  ZKSync = 'zksync',
  Dogecoin = 'dogecoin',
  Polkadot = 'polkadot',
  MultverseX = 'multiverse_x',
  ImmutableX = 'immutable_x',
  Flow = 'flow',
  Filecoin = 'filecoin',
  Fantom = 'fantom',
  Fuse = 'fuse',
  Kusama = 'kusama',
  Litecoin = 'litecoin',
  Near = 'near',
  OKCChain = 'okc_chain',
  Harmony = 'harmony',
  RSK = 'rsk',
  Gnosis = 'gnosis',
  Zilliqa = 'zilliqa',
  Starknet = 'starknet',
  Stellar = 'stellar',
  Ripple = 'ripple',
  Tezos = 'tezos',
}

export enum PaymentMethod {
  Bank = 'bank',
  DebitCard = 'debit_card',
  CreditCard = 'credit_card',
  ApplePay = 'apple_pay',
  GooglePay = 'google_pay',
}

export enum FiatCurrency {
  EUR = 'EUR',
  GBP = 'GBP',
  USD = 'USD',
}

export enum CalloutType {
  Rate = 'rate',
  InstantAvailable = 'instant_available',
  PaymentMethods = 'payment_methods',
  Networks = 'networks',
  FiatCurrencies = 'fiat_currencies',
}

export type ProviderConfig = {
  id: FiatProviderName;
  enabled: boolean;
  metadata: {
    accentColor: string;
    accentForegroundColor: string;
    paymentMethods: { type: PaymentMethod }[];
    networks: Network[];
    instantAvailable: boolean;
    fiatCurrencies: FiatCurrency[];
  };
  content: {
    title: string;
    description: string;
    callouts: (
      | {
          type: CalloutType.Rate;
          value: string;
        }
      | {
          type: CalloutType.InstantAvailable;
          value?: string;
        }
      | {
          type: CalloutType.PaymentMethods;
          methods: { type: PaymentMethod }[];
        }
      | {
          type: CalloutType.Networks;
          networks: Network[];
        }
      | {
          type: CalloutType.FiatCurrencies;
          currencies: FiatCurrency[];
        }
    )[];
  };
};
