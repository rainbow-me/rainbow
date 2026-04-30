import React from 'react';

import { FeaturedMintCard } from '@/components/cards/FeaturedMintCard';
import { GasCard } from '@/features/gas/components/GasCard';
import { LearnCard } from '@/components/cards/LearnCard';
import { LedgerCard } from '@/components/cards/LedgerCard';
import { MintsCard } from '@/components/cards/MintsCard/MintsCard';
import { OpRewardsCard } from '@/components/cards/OpRewardsCard';
import { avoidScamsCard, backupsCard, cryptoAndWalletsCard } from '@/components/cards/utils/constants';
import { TrendingTokens } from '@/components/Discover/TrendingTokens';
import { Box, Inline, Inset, Stack, Text } from '@/design-system';
import { IS_TEST } from '@/env';
import { CARD_HEIGHT, CARD_WIDTH, MarketCarousel } from '@/features/discover/components/MarketCarousel';
import { ENSCreateProfileCard } from '@/features/ens/components/ENSCreateProfileCard';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import {
  useDiscoverPlacementAvailability,
  useSyncDiscoverPlacementAvailabilityNetwork,
} from '@/features/placements/stores/discover/discoverPlacementAvailabilityStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type PlacementItem } from '@/features/placements/types';
import walletTypes from '@/helpers/walletTypes';
import * as i18n from '@/languages';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useWallets } from '@/state/wallets/walletsStore';
import { HARDWARE_WALLETS, MINTS, OP_REWARDS, PROFILES, TRENDING_TOKENS } from '@rainbow-me/config/experimental';
import useExperimentalFlag from '@rainbow-me/config/experimentalHooks';

export const HORIZONTAL_PADDING = 20;

const keyExtractor = (item: PlacementItem) => `${item.ref.source}:${item.ref.id}`;

export default function DiscoverHome() {
  const { mints_enabled, op_rewards_enabled, profiles_enabled, trending_tokens_enabled } = useRemoteConfig();
  const profilesEnabledLocalFlag = useExperimentalFlag(PROFILES);
  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const mintsEnabled = (useExperimentalFlag(MINTS) || mints_enabled) && !IS_TEST;
  const opRewardsLocalFlag = useExperimentalFlag(OP_REWARDS);
  const trendingTokensEnabled = (useExperimentalFlag(TRENDING_TOKENS) || trending_tokens_enabled) && !IS_TEST;

  const testNetwork = useSyncDiscoverPlacementAvailabilityNetwork();
  const availability = useDiscoverPlacementAvailability();
  const isLoading = usePlacementsStore(state => state.status === 'loading' || state.status === 'idle');

  const isProfilesEnabled = profilesEnabledLocalFlag && profiles_enabled;
  const wallets = useWallets();
  const hasHardwareWallets = Object.keys(wallets || {}).some(key => (wallets || {})[key].type === walletTypes.bluetooth);

  const showPerpsPlacement = availability.perps && isLoading;
  const showPredictionsPlacement = availability.predictions && isLoading;
  const showPlacements = showPerpsPlacement || showPredictionsPlacement;

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
                  data={[] as PlacementItem[]}
                  keyExtractor={keyExtractor}
                  itemHeight={CARD_HEIGHT}
                  itemWidth={CARD_WIDTH}
                  renderItem={(_item, _helpers) => <Box />}
                  onSeeAll={() => undefined}
                  loading={isLoading}
                />
              )}
              {showPredictionsPlacement && (
                <MarketCarousel
                  title={i18n.t(i18n.l.discover.placements.predictions_title)}
                  placementId={PLACEMENT_IDS.PREDICTIONS}
                  data={[] as PlacementItem[]}
                  keyExtractor={keyExtractor}
                  itemHeight={CARD_HEIGHT}
                  itemWidth={CARD_WIDTH}
                  renderItem={(_item, _helpers) => <Box />}
                  onSeeAll={() => undefined}
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
