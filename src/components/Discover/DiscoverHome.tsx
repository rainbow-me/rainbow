import React from 'react';

import { FeaturedMintCard } from '@/components/cards/FeaturedMintCard';
import { GasCard } from '@/components/cards/GasCard';
import { LearnCard } from '@/components/cards/LearnCard';
import { LedgerCard } from '@/components/cards/LedgerCard';
import { MintsCard } from '@/components/cards/MintsCard/MintsCard';
import { OpRewardsCard } from '@/components/cards/OpRewardsCard';
import { avoidScamsCard, backupsCard, cryptoAndWalletsCard } from '@/components/cards/utils/constants';
import { FeatureCard } from '@/components/Discover/FeatureCard';
import { TrendingTokens } from '@/components/Discover/TrendingTokens';
import { FeaturedResultStack } from '@/components/FeaturedResult/FeaturedResultStack';
import { Box, Inline, Inset, Stack } from '@/design-system';
import { IS_TEST } from '@/env';
import { ENSCreateProfileCard } from '@/features/ens/components/ENSCreateProfileCard';
import { navigateToPolymarket } from '@/features/polymarket/utils/navigateToPolymarket';
import { isTestnetChain } from '@/handlers/web3';
import walletTypes from '@/helpers/walletTypes';
import useAccountSettings from '@/hooks/useAccountSettings';
import * as i18n from '@/languages';
import { useRemoteConfig } from '@/model/remoteConfig';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useWallets } from '@/state/wallets/walletsStore';
import useExperimentalFlag, {
  FEATURED_RESULTS,
  HARDWARE_WALLETS,
  MINTS,
  OP_REWARDS,
  POLYMARKET,
  PROFILES,
  TRENDING_TOKENS,
} from '@rainbow-me/config/experimentalHooks';

import { DiscoverFeaturedResultsCard } from './DiscoverFeaturedResultsCard';
import { DiscoverSeparator } from './DiscoverSeparator';

export const HORIZONTAL_PADDING = 20;

function onNavigate(url: string): void {
  Navigation.handleAction(Routes.DAPP_BROWSER_SCREEN, {
    url,
  });
}

export default function DiscoverHome() {
  const {
    profiles_enabled,
    mints_enabled,
    op_rewards_enabled,
    featured_results,
    trending_tokens_enabled,
    perps_enabled,
    polymarket_enabled,
  } = useRemoteConfig();
  const profilesEnabledLocalFlag = useExperimentalFlag(PROFILES);
  const profilesEnabledRemoteFlag = profiles_enabled;
  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const featuredResultsEnabled = (useExperimentalFlag(FEATURED_RESULTS) || featured_results) && !IS_TEST;
  const mintsEnabled = (useExperimentalFlag(MINTS) || mints_enabled) && !IS_TEST;
  const opRewardsLocalFlag = useExperimentalFlag(OP_REWARDS);
  const opRewardsRemoteFlag = op_rewards_enabled;
  const trendingTokensEnabled = (useExperimentalFlag(TRENDING_TOKENS) || trending_tokens_enabled) && !IS_TEST;
  const perpsEnabled = perps_enabled;
  const polymarketEnabled = (useExperimentalFlag(POLYMARKET) || polymarket_enabled) && !IS_TEST;

  const { chainId } = useAccountSettings();
  const testNetwork = isTestnetChain({ chainId });
  const isProfilesEnabled = profilesEnabledLocalFlag && profilesEnabledRemoteFlag;

  const wallets = useWallets();

  const hasHardwareWallets = Object.keys(wallets || {}).filter(key => (wallets || {})[key].type === walletTypes.bluetooth).length > 0;

  return (
    <Inset top="12px" bottom={{ custom: 200 }} horizontal={{ custom: HORIZONTAL_PADDING }}>
      {!testNetwork ? (
        <Box gap={20}>
          <Box flexDirection="row" gap={11}>
            {polymarketEnabled && (
              <FeatureCard
                accentColor={'#C863E8'}
                icon="􀫸"
                title={i18n.t(i18n.l.predictions.feature_card.title)}
                subtitle={i18n.t(i18n.l.predictions.feature_card.subtitle)}
                onPress={navigateToPolymarket}
              />
            )}
            {perpsEnabled && (
              <FeatureCard
                accentColor={'#3ECFAD'}
                icon="􀯠"
                title={i18n.t(i18n.l.perps.feature_card.title)}
                subtitle={i18n.t(i18n.l.perps.feature_card.subtitle)}
                onPress={() => {
                  Navigation.handleAction(Routes.PERPS_NAVIGATOR);
                }}
              />
            )}
          </Box>
          <DiscoverSeparator />
          {trendingTokensEnabled && <TrendingTokens />}
          {mintsEnabled && (
            <Stack space="20px">
              <FeaturedMintCard />
              <Inset top="12px">
                <MintsCard />
              </Inset>
            </Stack>
          )}
          {/* FIXME: IS_TEST disables nftOffers - this caused e2e tests to hang at exit */}
          {/* Requires new offers provider in order to re-enable this */}
          {/* {!IS_TEST && nftOffersEnabled && <NFTOffersCard />} */}
          {/* We have both flags here to be able to override the remote flag and show the card anyway in Dev*/}
          {featuredResultsEnabled && (
            <FeaturedResultStack onNavigate={onNavigate} placementId="discover_big">
              {({ featuredResult, handlePress }) => (
                <DiscoverFeaturedResultsCard handlePress={handlePress} featuredResult={featuredResult} />
              )}
            </FeaturedResultStack>
          )}
          {(opRewardsRemoteFlag || opRewardsLocalFlag) && <OpRewardsCard />}
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
