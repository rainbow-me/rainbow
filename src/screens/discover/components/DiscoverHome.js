import React, { useMemo } from 'react';
import useExperimentalFlag, { OP_REWARDS, PROFILES, HARDWARE_WALLETS, MINTS, NFT_OFFERS } from '@rainbow-me/config/experimentalHooks';
import { isTestnetNetwork } from '@/handlers/web3';
import { Inline, Inset, Stack } from '@/design-system';
import { useAccountSettings, useWallets } from '@/hooks';
import { ENSCreateProfileCard } from '@/components/cards/ENSCreateProfileCard';
import { ENSSearchCard } from '@/components/cards/ENSSearchCard';
import { GasCard } from '@/components/cards/GasCard';
import { LearnCard } from '@/components/cards/LearnCard';
import { avoidScamsCard, backupsCard, cryptoAndWalletsCard } from '@/components/cards/utils/constants';
import { OpRewardsCard } from '@/components/cards/OpRewardsCard';
import { LedgerCard } from '@/components/cards/LedgerCard';
import { useRemoteConfig } from '@/model/remoteConfig';
import walletTypes from '@/helpers/walletTypes';
import { NFTOffersCard } from '@/components/cards/NFTOffersCard';
import { MintsCard } from '@/components/cards/MintsCard/MintsCard';
import { FeaturedMintCard } from '@/components/cards/FeaturedMintCard';
import { IS_TEST } from '@/env';
import { RemoteCardCarousel } from '@/components/cards/remote-cards';
import { useRoute } from '@react-navigation/native';
import { remoteCardsStore } from '@/state/remoteCards/remoteCards';

export default function DiscoverHome() {
  const { profiles_enabled, mints_enabled, op_rewards_enabled } = useRemoteConfig();
  const { network } = useAccountSettings();
  const getCardsForScreen = remoteCardsStore(state => state.getCardsForScreen);
  const { name } = useRoute();
  const profilesEnabledLocalFlag = useExperimentalFlag(PROFILES);
  const profilesEnabledRemoteFlag = profiles_enabled;
  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const nftOffersEnabled = useExperimentalFlag(NFT_OFFERS);
  const mintsEnabled = (useExperimentalFlag(MINTS) || mints_enabled) && !IS_TEST;
  const opRewardsLocalFlag = useExperimentalFlag(OP_REWARDS);
  const opRewardsRemoteFlag = op_rewards_enabled;
  const testNetwork = isTestnetNetwork(network);
  const isProfilesEnabled = profilesEnabledLocalFlag && profilesEnabledRemoteFlag;

  const { wallets } = useWallets();

  const hasHardwareWallets = Object.keys(wallets || {}).filter(key => wallets[key].type === walletTypes.bluetooth).length > 0;

  const cards = useMemo(() => getCardsForScreen(name), [name, getCardsForScreen]);

  return (
    <Inset top="20px" bottom={{ custom: 200 }} horizontal="20px">
      {!testNetwork ? (
        <Stack space="20px">
          <Inline wrap={false} space="20px">
            <GasCard />
            {isProfilesEnabled && <ENSSearchCard />}
          </Inline>
          {!!cards.length && <RemoteCardCarousel />}
          {mintsEnabled && (
            <Stack space="20px">
              <FeaturedMintCard />
              <Inset top="12px">
                <MintsCard />
              </Inset>
            </Stack>
          )}
          {/* FIXME: IS_TESTING disables nftOffers this makes some DETOX tests hang forever at exit - investigate */}
          {!IS_TEST && nftOffersEnabled && <NFTOffersCard />}
          {/* We have both flags here to be able to override the remote flag and show the card anyway in Dev*/}
          {(opRewardsRemoteFlag || opRewardsLocalFlag) && <OpRewardsCard />}
          {hardwareWalletsEnabled && !hasHardwareWallets && <LedgerCard />}
          {isProfilesEnabled && <ENSCreateProfileCard />}
          <Inline wrap={false} space="20px">
            <LearnCard cardDetails={backupsCard} type="square" />
            <LearnCard cardDetails={avoidScamsCard} type="square" />
          </Inline>
        </Stack>
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
