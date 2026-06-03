import { type UniqueId } from '@/__swaps__/types/assets';
import { type ChainId } from '@/state/backendNetworks/types';

export type FarcasterUser = {
  username: string;
  pfp_url: string;
};

export type TrendingToken = {
  uniqueId: UniqueId;
  chainId: ChainId;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  price: number;
  priceChange: {
    hr: number;
    day: number;
  };
  marketCap: number;
  volume: number;
  highlightedFriends: FarcasterUser[];
  remainingFriendsCount?: number;
  colors: {
    primary: string;
  };
  icon_url: string;
  transferable: boolean;
  creationDate: string | null;
};
