import React from 'react';

import { FeaturedMintCard } from '@/components/cards/FeaturedMintCard';
import { GasCard } from '@/components/cards/GasCard';
import { LearnCard } from '@/components/cards/LearnCard';
import { LedgerCard } from '@/components/cards/LedgerCard';
import { MintsCard } from '@/components/cards/MintsCard/MintsCard';
import { OpRewardsCard } from '@/components/cards/OpRewardsCard';
import { avoidScamsCard, backupsCard, cryptoAndWalletsCard } from '@/components/cards/utils/constants';
import { MarketCarousel } from '@/components/Discover/MarketCarousel';
import { PerpMarketCard } from '@/components/Discover/PerpMarketCard';
import { PredictionMarketCard } from '@/components/Discover/PredictionMarketCard';
import { TrendingTokens } from '@/components/Discover/TrendingTokens';
import { useDiscoverPlacements } from '@/components/Discover/useDiscoverPlacements';
import { FeaturedResultStack } from '@/components/FeaturedResult/FeaturedResultStack';
import { Box, Inline, Inset, Stack } from '@/design-system';
import { IS_TEST } from '@/env';
import { ENSCreateProfileCard } from '@/features/ens/components/ENSCreateProfileCard';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { navigateToPerps } from '@/features/perps/utils/navigateToPerps';
import { type PlacementItem } from '@/features/placements/types';
import { navigateToPolymarket } from '@/features/polymarket/utils/navigateToPolymarket';
import { isTestnetChain } from '@/handlers/web3';
import walletTypes from '@/helpers/walletTypes';
import useAccountSettings from '@/hooks/useAccountSettings';
import { useRemoteConfig } from '@/model/remoteConfig';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useWallets } from '@/state/wallets/walletsStore';
import useExperimentalFlag, {
  FEATURED_RESULTS,
  HARDWARE_WALLETS,
  MINTS,
  OP_REWARDS,
  PROFILES,
  TRENDING_TOKENS,
} from '@rainbow-me/config/experimentalHooks';

import { DiscoverFeaturedResultsCard } from './DiscoverFeaturedResultsCard';
import { DiscoverSeparator } from './DiscoverSeparator';

export const HORIZONTAL_PADDING = 20;

const PERPS_PLACEMENT_ID = 'discover_featured_perps_carousel';
const PREDICTIONS_PLACEMENT_ID = 'discover_featured_predictions_carousel';

const keyExtractor = (item: PlacementItem) => `${item.ref.source}:${item.ref.id}`;
const renderPerpCard = (item: PlacementItem) => <PerpMarketCard item={item} />;
const renderPredictionCard = (item: PlacementItem) => <PredictionMarketCard item={item} />;

function onNavigate(url: string): void {
  Navigation.handleAction(Routes.DAPP_BROWSER_SCREEN, {
    url,
  });
}

export default function DiscoverHome() {
  const { profiles_enabled, mints_enabled, op_rewards_enabled, featured_results, trending_tokens_enabled, discover_placements_enabled } =
    useRemoteConfig();
  const profilesEnabledLocalFlag = useExperimentalFlag(PROFILES);
  const profilesEnabledRemoteFlag = profiles_enabled;
  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const featuredResultsEnabled = (useExperimentalFlag(FEATURED_RESULTS) || featured_results) && !IS_TEST;
  const mintsEnabled = (useExperimentalFlag(MINTS) || mints_enabled) && !IS_TEST;
  const opRewardsLocalFlag = useExperimentalFlag(OP_REWARDS);
  const opRewardsRemoteFlag = op_rewards_enabled;
  const trendingTokensEnabled = (useExperimentalFlag(TRENDING_TOKENS) || trending_tokens_enabled) && !IS_TEST;
  const discoverPlacementsEnabled = discover_placements_enabled && !IS_TEST;

  const { placements, isLoading } = useDiscoverPlacements();
  const marketsLoaded = useHyperliquidMarketsStore(state => Object.keys(state.markets).length > 0);

  const perpsPlacement = placements.find(p => p.id === PERPS_PLACEMENT_ID);
  const predictionsPlacement = placements.find(p => p.id === PREDICTIONS_PLACEMENT_ID);

  const { chainId } = useAccountSettings();
  const testNetwork = isTestnetChain({ chainId });
  const isProfilesEnabled = profilesEnabledLocalFlag && profilesEnabledRemoteFlag;

  const wallets = useWallets();

  const hasHardwareWallets = Object.keys(wallets || {}).filter(key => (wallets || {})[key].type === walletTypes.bluetooth).length > 0;

  return (
    <Inset top="12px" bottom={{ custom: 200 }} horizontal={{ custom: HORIZONTAL_PADDING }}>
      {!testNetwork ? (
        <Box gap={20}>
          {discoverPlacementsEnabled && (
            <Box gap={20}>
              <MarketCarousel
                icon="􀯠"
                title="Perps"
                accentColor="#3ECFAD"
                onSeeAll={navigateToPerps}
                data={perpsPlacement?.items ?? []}
                renderItem={renderPerpCard}
                keyExtractor={keyExtractor}
                loading={isLoading || !marketsLoaded}
              />
              <MarketCarousel
                icon="􀫸"
                title="Predictions"
                accentColor="#C863E8"
                onSeeAll={navigateToPolymarket}
                data={predictionsPlacement?.items ?? []}
                renderItem={renderPredictionCard}
                keyExtractor={keyExtractor}
                loading={isLoading}
              />
            </Box>
          )}
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
