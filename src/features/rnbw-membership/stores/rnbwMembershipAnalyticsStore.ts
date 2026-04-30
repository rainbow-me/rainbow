import { createBaseStore, createStoreActions } from '@storesjs/stores';

import { analytics } from '@/analytics';
import type { Tier, TierId } from '@/features/rnbw-membership/types';
import { RNBW_DECIMALS } from '@/features/rnbw-staking/constants';
import { convertRawAmountToDecimalFormat, greaterThan } from '@/helpers/utilities';
import { getOwnedWalletAddresses } from '@/state/wallets/walletsStore';

type RnbwMembershipAnalyticsPosition = {
  stakedRnbwRaw: string;
  tier: TierId;
};

type RnbwMembershipAnalyticsPositionsByAddress = Record<string, RnbwMembershipAnalyticsPosition>;

type RnbwMembershipAnalyticsStore = {
  positionsByAddress: RnbwMembershipAnalyticsPositionsByAddress;
  recordPosition: (params: { address: string; position: RnbwMembershipAnalyticsPosition; allTiers: Tier[] }) => void;
};

export const useRnbwMembershipAnalyticsStore = createBaseStore<RnbwMembershipAnalyticsStore>(
  (set, get) => ({
    positionsByAddress: {},
    recordPosition: ({ address, position, allTiers }) => {
      const normalizedAddress = address.toLowerCase();
      const ownedWalletAddresses = getOwnedWalletAddresses();
      if (!ownedWalletAddresses.includes(normalizedAddress)) return;

      set(state => ({
        positionsByAddress: { ...state.positionsByAddress, [normalizedAddress]: position },
      }));

      const highestPosition = getHighestRnbwMembershipAnalyticsPosition({
        positionsByAddress: get().positionsByAddress,
        ownedAddresses: ownedWalletAddresses,
        allTiers,
      });

      if (!highestPosition) return;

      analytics.identify({
        stakedRnbw: convertRawAmountToDecimalFormat(highestPosition.stakedRnbwRaw, RNBW_DECIMALS),
        rnbwMembershipTier: highestPosition.tier,
      });
    },
  }),
  { storageKey: 'rnbwMembershipAnalytics' }
);

export const rnbwMembershipAnalyticsActions = createStoreActions(useRnbwMembershipAnalyticsStore);

function getHighestRnbwMembershipAnalyticsPosition({
  positionsByAddress,
  ownedAddresses,
  allTiers,
}: {
  positionsByAddress: RnbwMembershipAnalyticsPositionsByAddress;
  ownedAddresses: string[];
  allTiers: Tier[];
}): RnbwMembershipAnalyticsPosition | null {
  const tierRank = new Map(allTiers.map(({ level }, i) => [level, i]));
  const ownedAddressSet = new Set(ownedAddresses.map(a => a.toLowerCase()));

  const isHigher = (a: RnbwMembershipAnalyticsPosition, b: RnbwMembershipAnalyticsPosition) => {
    const rankA = tierRank.get(a.tier) ?? -1;
    const rankB = tierRank.get(b.tier) ?? -1;
    if (rankA !== rankB) return rankA > rankB;
    return greaterThan(a.stakedRnbwRaw, b.stakedRnbwRaw);
  };

  let highest: RnbwMembershipAnalyticsPosition | null = null;
  for (const [address, position] of Object.entries(positionsByAddress)) {
    if (!ownedAddressSet.has(address.toLowerCase())) continue;
    if (!highest || isHigher(position, highest)) highest = position;
  }
  return highest;
}
