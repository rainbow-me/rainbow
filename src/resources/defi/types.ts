import { NativeCurrencyKey, ZerionAsset } from '@/entities';
import { Network } from '@/networks/types';

export type AddysPositionsResponse =
  | {
      meta: Record<string, any>;
      payload: Record<string, any>;
    }
  | Record<string, never>;

export type PositionsArgs = {
  address: string;
  currency: NativeCurrencyKey;
};

export type NativeDisplay = {
  amount: string;
  display: string;
};

export type PositionAsset = ZerionAsset & { network: Network };

export type PositionDapp = {
  name: string;
  url: string;
  icon_url: string;
  colors: {
    primary: string;
    fallback: string;
    shadow: string;
  };
};

export type PositionsTotals = {
  totals: NativeDisplay;
  borrows: NativeDisplay;
  claimables: NativeDisplay;
  deposits: NativeDisplay;
};
export type Claimable = {
  asset: PositionAsset;
  quantity: string;
};
export type Deposit = {
  apr: string;
  apy: string;
  asset: PositionAsset;
  quantity: string;
  total_asset: string; // what does this mean?
  underlying: { asset: PositionAsset; quantity: string }[];
};
export type Borrow = {
  apr: string;
  apy: string;
  asset: PositionAsset;
  quantity: string;
  total_asset: string; // what does this mean?
  underlying: { asset: PositionAsset; quantity: string }[];
};

export type RainbowClaimable = {
  asset: PositionAsset;
  quantity: string;
  native: NativeDisplay;
};
export type RainbowDeposit = {
  apr: string;
  apy: string;
  asset: PositionAsset;
  quantity: string;
  total_asset: string; // what does this mean?
  underlying: {
    asset: PositionAsset;
    quantity: string;
    native: NativeDisplay;
  }[];
};
export type RainbowBorrow = {
  apr: string;
  apy: string;
  asset: PositionAsset;
  quantity: string;
  total_asset: string; // what does this mean?
  underlying: {
    asset: PositionAsset;
    quantity: string;
    native: NativeDisplay;
  }[];
};

// TODO: need to add dapp metadata once its added via BE
export type Position = {
  type: string;
  claimables: Claimable[];
  borrows: Borrow[];
  deposits: Deposit[];
  dapp: PositionDapp;
};

export type RainbowPosition = {
  type: string;
  totals: PositionsTotals;
  claimables: RainbowClaimable[];
  borrows: RainbowBorrow[];
  deposits: RainbowDeposit[];
  dapp: PositionDapp;
};

export type RainbowPositions = {
  totals: {
    total: NativeDisplay;
    borrows: NativeDisplay;
    claimables: NativeDisplay;
    deposits: NativeDisplay;
  };
  positionTokens: string[];
  positions: RainbowPosition[];
};
