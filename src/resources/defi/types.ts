import { NativeCurrencyKey, ZerionAsset } from '@/entities';
import { ChainId, Network } from '@/chains/types';
import { TokenColors } from '@/graphql/__generated__/metadata';

export type AddysPositionsResponse =
  | {
      meta: Record<string, any>;
      payload: {
        positions: Position[];
      };
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

// TODO: this does not have all the fields returned by the API
export type PositionAsset = ZerionAsset & {
  network: Network;
  chain_id: ChainId;
  networks: Record<ChainId, { address: string; decimals: number }>;
  colors: TokenColors;
};

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

export type UnderlyingAsset = {
  asset: PositionAsset;
  quantity: string;
};

export type PositionsTotals = {
  totals: NativeDisplay;
  totalLocked: string;
  borrows: NativeDisplay;
  claimables: NativeDisplay;
  deposits: NativeDisplay;
  stakes: NativeDisplay;
};
export type Claimable = {
  asset: PositionAsset;
  quantity: string;
  omit_from_total?: boolean;
};
export type Deposit = {
  asset: PositionAsset;
  quantity: string;
  apr?: string;
  apy?: string;
  total_asset?: string; // what does this mean?
  omit_from_total?: boolean;
  underlying?: UnderlyingAsset[];
};
export type Borrow = {
  apr: string;
  apy: string;
  asset: PositionAsset;
  quantity: string;
  total_asset: string; // what does this mean?
  omit_from_total?: boolean;
  underlying: UnderlyingAsset[];
};
export type Stake = {
  asset: PositionAsset;
  quantity: string;
  apr?: string;
  apy?: string;
  total_asset?: string; // what does this mean?
  omit_from_total?: boolean;
  underlying?: UnderlyingAsset[];
};

export type RainbowUnderlyingAsset = UnderlyingAsset & { native: NativeDisplay };

export type RainbowClaimable = {
  asset: PositionAsset;
  quantity: string;
  native: NativeDisplay;
  omit_from_total?: boolean;
  dappVersion?: string;
};
export type RainbowDeposit = {
  asset: PositionAsset;
  quantity: string;
  isLp: boolean;
  isConcentratedLiquidity: boolean;
  omit_from_total?: boolean;
  underlying: RainbowUnderlyingAsset[];
  apr?: string;
  apy?: string;
  dappVersion?: string;
  total_asset?: string; // what does this mean?
};
export type RainbowBorrow = {
  asset: PositionAsset;
  quantity: string;
  omit_from_total?: boolean;
  apr: string;
  apy: string;
  total_asset: string; // what does this mean?
  dappVersion?: string;
  underlying: RainbowUnderlyingAsset[];
};
export type RainbowStake = {
  asset: PositionAsset;
  quantity: string;
  isLp: boolean;
  isConcentratedLiquidity: boolean;
  omit_from_total?: boolean;
  underlying: RainbowUnderlyingAsset[];
  dappVersion?: string;
  apr?: string;
  apy?: string;
};

// TODO: need to add dapp metadata once its added via BE
export type Position = {
  type: string;
  claimables: Claimable[];
  borrows: Borrow[];
  stakes: Stake[];
  deposits: Deposit[];
  dapp: PositionDapp;
};

export type RainbowPosition = {
  type: string;
  totals: PositionsTotals;
  claimables: RainbowClaimable[];
  borrows: RainbowBorrow[];
  deposits: RainbowDeposit[];
  stakes: RainbowStake[];
  dapp: PositionDapp;
};

export type RainbowPositions = {
  totals: PositionsTotals & { total: NativeDisplay };
  positionTokens: string[];
  positions: RainbowPosition[];
};
