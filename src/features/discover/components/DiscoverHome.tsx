import React from 'react';

import { FeaturedMintCard } from '@/components/cards/FeaturedMintCard';
import { GasCard } from '@/components/cards/GasCard';
import { LearnCard } from '@/components/cards/LearnCard';
import { LedgerCard } from '@/components/cards/LedgerCard';
import { MintsCard } from '@/components/cards/MintsCard/MintsCard';
import { OpRewardsCard } from '@/components/cards/OpRewardsCard';
import { avoidScamsCard, backupsCard, cryptoAndWalletsCard } from '@/components/cards/utils/constants';
import { TrendingTokens } from '@/components/Discover/TrendingTokens';
import { Box, Inline, Inset, Stack, Text } from '@/design-system';
import { IS_TEST } from '@/env';
import { MarketCarousel } from '@/features/discover/components/MarketCarousel';
import {
  computePerpCardWidth,
  PERP_MARKET_CARD_HEIGHT,
  PERP_MARKET_CARD_SLOT_WIDTH_WITH_CHART,
  PerpMarketCard,
  type PerpMarketCardProps,
} from '@/features/discover/components/PerpMarketCard';
import { ENSCreateProfileCard } from '@/features/ens/components/ENSCreateProfileCard';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { navigateToPerpsSearch } from '@/features/perps/utils/navigateToPerps';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import {
  useDiscoverPlacementAvailability,
  useSyncDiscoverPlacementAvailabilityNetwork,
} from '@/features/placements/stores/discover/discoverPlacementAvailabilityStore';
import { useDiscoverPlacements } from '@/features/placements/stores/discover/discoverPlacementsStore';
import { type PlacementItem } from '@/features/placements/types';
import walletTypes from '@/helpers/walletTypes';
import * as i18n from '@/languages';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useWallets } from '@/state/wallets/walletsStore';
import useExperimentalFlag, { HARDWARE_WALLETS, MINTS, OP_REWARDS, PROFILES, TRENDING_TOKENS } from '@rainbow-me/config/experimentalHooks';

export const HORIZONTAL_PADDING = 20;

const keyExtractor = (item: PlacementItem) => `${item.ref.source}:${item.ref.id}`;

const renderPerpCard = (item: PlacementItem, { trackPress }: { trackPress: PerpMarketCardProps['onPressTracked'] }) => (
  <PerpMarketCard item={item} onPressTracked={trackPress} />
);

const getPerpCardWidth = (item: PlacementItem) => {
  const symbol = useHyperliquidMarketsStore.getState().getMarket(item.ref.id)?.baseSymbol ?? item.ref.id;
  return computePerpCardWidth({ symbol });
};

export default function DiscoverHome() {
  const { mints_enabled, op_rewards_enabled, profiles_enabled, trending_tokens_enabled } = useRemoteConfig();
  const profilesEnabledLocalFlag = useExperimentalFlag(PROFILES);
  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const mintsEnabled = (useExperimentalFlag(MINTS) || mints_enabled) && !IS_TEST;
  const opRewardsLocalFlag = useExperimentalFlag(OP_REWARDS);
  const trendingTokensEnabled = (useExperimentalFlag(TRENDING_TOKENS) || trending_tokens_enabled) && !IS_TEST;

  const testNetwork = useSyncDiscoverPlacementAvailabilityNetwork();
  const availability = useDiscoverPlacementAvailability();
  const { placements, isLoading } = useDiscoverPlacements();

  const isProfilesEnabled = profilesEnabledLocalFlag && profiles_enabled;
  const wallets = useWallets();
  const hasHardwareWallets = Object.keys(wallets || {}).some(key => (wallets || {})[key].type === walletTypes.bluetooth);

  const perpsPlacement = placements.find(placement => placement.id === PLACEMENT_IDS.PERPS);
  const showPerpsPlacement = availability.perps && (isLoading || Boolean(perpsPlacement?.items.length));
  const showPlacements = showPerpsPlacement;

  return (
    <Inset top="12px" bottom={{ custom: 200 }} horizontal={{ custom: HORIZONTAL_PADDING }}>
      {!testNetwork ? (
        <Box gap={20}>
          {showPlacements && (
            <Box gap={20}>
              {showPerpsPlacement && (
                <MarketCarousel
                  title={i18n.t(i18n.l.discover.placements.perps_title)}
                  placementId={PLACEMENT_IDS.PERPS}
                  placement={perpsPlacement}
                  itemHeight={PERP_MARKET_CARD_HEIGHT}
                  itemWidth={PERP_MARKET_CARD_SLOT_WIDTH_WITH_CHART}
                  getItemWidth={getPerpCardWidth}
                  data={perpsPlacement?.items ?? []}
                  keyExtractor={keyExtractor}
                  renderItem={renderPerpCard}
                  onSeeAll={navigateToPerpsSearch}
                  loading={isLoading}
                />
              )}
            </Box>
          )}
          {trendingTokensEnabled && (
            <Box gap={20}>
              <Text size="22pt" weight="heavy" color="label">
                {i18n.t(i18n.l.discover.sections.tokens)}
              </Text>
              <TrendingTokens />
            </Box>
          )}
          {mintsEnabled && (
            <Stack space="20px">
              <FeaturedMintCard />
              <Inset top="12px">
                <MintsCard />
              </Inset>
            </Stack>
          )}
          {(op_rewards_enabled || opRewardsLocalFlag) && <OpRewardsCard />}
          {hardwareWalletsEnabled && !hasHardwareWallets && <LedgerCard />}
          {isProfilesEnabled && <ENSCreateProfileCard />}
          <Inline wrap={false} space="20px">
            <LearnCard cardDetails={backupsCard} type="square" />
            <LearnCard cardDetails={avoidScamsCard} type="square" />
          </Inline>
        </Box>
      ) : (
        <Stack space="20px">
          <Inline space="20px">
            <GasCard />
            <LearnCard cardDetails={cryptoAndWalletsCard} type="square" />
          </Inline>
        </Stack>
      )}
    </Inset>
  );
}
