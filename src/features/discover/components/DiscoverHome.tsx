import React from 'react';

import { FeaturedMintCard } from '@/components/cards/FeaturedMintCard';
import { GasCard } from '@/components/cards/GasCard';
import { LearnCard } from '@/components/cards/LearnCard';
import { LedgerCard } from '@/components/cards/LedgerCard';
import { MintsCard } from '@/components/cards/MintsCard/MintsCard';
import { OpRewardsCard } from '@/components/cards/OpRewardsCard';
import { avoidScamsCard, backupsCard, cryptoAndWalletsCard } from '@/components/cards/utils/constants';
import { TrendingTokens } from '@/components/Discover/TrendingTokens';
import { Box, Inline, Inset, Stack } from '@/design-system';
import { IS_TEST } from '@/env';
import { ENSCreateProfileCard } from '@/features/ens/components/ENSCreateProfileCard';
import { isTestnetChain } from '@/handlers/web3';
import walletTypes from '@/helpers/walletTypes';
import useAccountSettings from '@/hooks/useAccountSettings';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useWallets } from '@/state/wallets/walletsStore';
import useExperimentalFlag, { HARDWARE_WALLETS, MINTS, OP_REWARDS, PROFILES, TRENDING_TOKENS } from '@rainbow-me/config/experimentalHooks';

export const HORIZONTAL_PADDING = 20;

export default function DiscoverHome() {
  const { profiles_enabled, mints_enabled, op_rewards_enabled, trending_tokens_enabled } = useRemoteConfig();
  const profilesEnabledLocalFlag = useExperimentalFlag(PROFILES);
  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const mintsEnabled = (useExperimentalFlag(MINTS) || mints_enabled) && !IS_TEST;
  const opRewardsLocalFlag = useExperimentalFlag(OP_REWARDS);
  const trendingTokensEnabled = (useExperimentalFlag(TRENDING_TOKENS) || trending_tokens_enabled) && !IS_TEST;

  const { chainId } = useAccountSettings();
  const testNetwork = isTestnetChain({ chainId });
  const isProfilesEnabled = profilesEnabledLocalFlag && profiles_enabled;

  const wallets = useWallets();
  const hasHardwareWallets = Object.keys(wallets || {}).filter(key => (wallets || {})[key].type === walletTypes.bluetooth).length > 0;

  return (
    <Inset top="12px" bottom={{ custom: 200 }} horizontal={{ custom: HORIZONTAL_PADDING }}>
      {!testNetwork ? (
        <Box gap={20}>
          {trendingTokensEnabled && <TrendingTokens />}
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
