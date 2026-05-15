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
import { PerpMarketsCarousel } from '@/features/discover/components/carousels/PerpMarketsCarousel';
import { PredictionsCarousel } from '@/features/discover/components/carousels/PredictionsCarousel';
import { ENSCreateProfileCard } from '@/features/ens/components/ENSCreateProfileCard';
import walletTypes from '@/helpers/walletTypes';
import * as i18n from '@/languages';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { HARDWARE_WALLETS, MINTS, OP_REWARDS, PROFILES, TRENDING_TOKENS } from '@rainbow-me/config/experimental';
import useExperimentalFlag from '@rainbow-me/config/experimentalHooks';

export function DiscoverHome() {
  return (
    <Inset top="12px" bottom={{ custom: 200 }} horizontal={{ custom: 20 }}>
      <Box gap={32}>
        <PerpMarketsCarousel />
        <PredictionsCarousel />
        <TrendingTokensSection />
        <Box gap={20}>
          <MintsSection />
          <OpRewardsSection />
          <HardwareWalletSection />
          <ProfilesSection />
          <LearnCards />
        </Box>
      </Box>
    </Inset>
  );
}

function TrendingTokensSection() {
  const { trending_tokens_enabled } = useRemoteConfig('trending_tokens_enabled');
  const trendingTokensEnabled = (useExperimentalFlag(TRENDING_TOKENS) || trending_tokens_enabled) && !IS_TEST;

  if (!trendingTokensEnabled) return null;

  return (
    <Box gap={20}>
      <Text size="22pt" weight="heavy" color="label">
        {i18n.t(i18n.l.discover.sections.tokens)}
      </Text>
      <TrendingTokens />
    </Box>
  );
}

function MintsSection() {
  const { mints_enabled } = useRemoteConfig('mints_enabled');
  const mintsEnabled = (useExperimentalFlag(MINTS) || mints_enabled) && !IS_TEST;

  if (!mintsEnabled) return null;

  return (
    <Stack space="20px">
      <FeaturedMintCard />
      <Inset top="12px">
        <MintsCard />
      </Inset>
    </Stack>
  );
}

function OpRewardsSection() {
  const { op_rewards_enabled } = useRemoteConfig('op_rewards_enabled');
  const opRewardsEnabled = useExperimentalFlag(OP_REWARDS) || op_rewards_enabled;

  return opRewardsEnabled ? <OpRewardsCard /> : null;
}

function HardwareWalletSection() {
  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const hasHardwareWallets = useWalletsStore(state => Object.values(state.wallets).some(wallet => wallet.type === walletTypes.bluetooth));

  if (!hardwareWalletsEnabled || hasHardwareWallets) return null;

  return <LedgerCard />;
}

function ProfilesSection() {
  const { profiles_enabled } = useRemoteConfig('profiles_enabled');
  const profilesEnabled = useExperimentalFlag(PROFILES) && profiles_enabled;

  return profilesEnabled ? <ENSCreateProfileCard /> : null;
}

function LearnCards() {
  return (
    <Inline wrap={false} space="20px">
      <LearnCard cardDetails={backupsCard} type="square" />
      <LearnCard cardDetails={avoidScamsCard} type="square" />
    </Inline>
  );
}
