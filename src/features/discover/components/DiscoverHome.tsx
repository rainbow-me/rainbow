import React from 'react';

import { FeaturedMintCard } from '@/components/cards/FeaturedMintCard';
import { LearnCard } from '@/components/cards/LearnCard';
import { LedgerCard } from '@/components/cards/LedgerCard';
import { MintsCard } from '@/components/cards/MintsCard/MintsCard';
import { OpRewardsCard } from '@/components/cards/OpRewardsCard';
import { avoidScamsCard, backupsCard } from '@/components/cards/utils/constants';
import { TrendingTokens } from '@/components/Discover/TrendingTokens';
import { Box, Inline, Inset, Stack, Text } from '@/design-system';
import { IS_TEST } from '@/env';
import { PerpsMarketCarousel } from '@/features/discover/components/PerpsMarketCarousel';
import { PredictionsMarketCarousel } from '@/features/discover/components/PredictionsMarketCarousel';
import { ENSCreateProfileCard } from '@/features/ens/components/ENSCreateProfileCard';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { useDiscoverPlacementAvailability } from '@/features/placements/stores/discover/discoverPlacementAvailabilityStore';
import walletTypes from '@/helpers/walletTypes';
import * as i18n from '@/languages';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useWallets } from '@/state/wallets/walletsStore';
import { HARDWARE_WALLETS, MINTS, OP_REWARDS, PROFILES, TRENDING_TOKENS } from '@rainbow-me/config/experimental';
import useExperimentalFlag from '@rainbow-me/config/experimentalHooks';

export const HORIZONTAL_PADDING = 20;

export default function DiscoverHome() {
  const { mints_enabled, op_rewards_enabled, profiles_enabled, trending_tokens_enabled } = useRemoteConfig();
  const profilesEnabledLocalFlag = useExperimentalFlag(PROFILES);
  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const mintsEnabled = (useExperimentalFlag(MINTS) || mints_enabled) && !IS_TEST;
  const opRewardsLocalFlag = useExperimentalFlag(OP_REWARDS);
  const trendingTokensEnabled = (useExperimentalFlag(TRENDING_TOKENS) || trending_tokens_enabled) && !IS_TEST;

  const availability = useDiscoverPlacementAvailability();

  const isProfilesEnabled = profilesEnabledLocalFlag && profiles_enabled;
  const wallets = useWallets();
  const hasHardwareWallets = Object.keys(wallets || {}).some(key => (wallets || {})[key].type === walletTypes.bluetooth);

  const showPerps = availability[PLACEMENT_IDS.DISCOVER_PERPS_CAROUSEL];
  const showPredictions = availability[PLACEMENT_IDS.DISCOVER_PREDICTIONS_CAROUSEL];
  const showPlacements = showPerps || showPredictions;

  return (
    <Inset top="12px" bottom={{ custom: 200 }} horizontal={{ custom: HORIZONTAL_PADDING }}>
      <Box gap={20}>
        {showPlacements && (
          <Box gap={20}>
            {showPerps && <PerpsMarketCarousel />}
            {showPredictions && <PredictionsMarketCarousel />}
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
    </Inset>
  );
}
