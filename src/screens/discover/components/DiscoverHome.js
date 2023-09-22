import React from 'react';
import useExperimentalFlag, {
  OP_REWARDS,
  PROFILES,
  HARDWARE_WALLETS,
  MINTS,
  NFT_OFFERS,
} from '@rainbow-me/config/experimentalHooks';
import Lists from './ListsSection';
import { isTestnetNetwork } from '@/handlers/web3';
import { Inline, Inset, Stack } from '@/design-system';
import { useAccountSettings, useWallets } from '@/hooks';
import { ENSCreateProfileCard } from '@/components/cards/ENSCreateProfileCard';
import { ENSSearchCard } from '@/components/cards/ENSSearchCard';
import { DPICard } from '@/components/cards/DPICard';
import { GasCard } from '@/components/cards/GasCard';
import { LearnCard } from '@/components/cards/LearnCard';
import {
  avoidScamsCard,
  backupsCard,
  cryptoAndWalletsCard,
} from '@/components/cards/utils/constants';
import { OpRewardsCard } from '@/components/cards/OpRewardsCard';
import { LedgerCard } from '@/components/cards/LedgerCard';
import config from '@/model/config';
import walletTypes from '@/helpers/walletTypes';
import { NFTOffersCard } from '@/components/cards/NFTOffersCard';
import { MintsCard } from '@/components/cards/MintsCard/MintsCard';
import { FeaturedMintCard } from '@/components/cards/FeaturedMintCard';
import { useMints } from '@/resources/mints';
import { IS_TEST } from '@/env';

export default function DiscoverHome() {
  const { accountAddress, network } = useAccountSettings();
  const profilesEnabledLocalFlag = useExperimentalFlag(PROFILES);
  const profilesEnabledRemoteFlag = config.profiles_enabled;
  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const nftOffersEnabled = useExperimentalFlag(NFT_OFFERS);
  const mintsEnabled =
    (useExperimentalFlag(MINTS) || config.mints_enabled) && !IS_TEST;
  const opRewardsLocalFlag = useExperimentalFlag(OP_REWARDS);
  const opRewardsRemoteFlag = config.op_rewards_enabled;
  const testNetwork = isTestnetNetwork(network);
  const isProfilesEnabled =
    profilesEnabledLocalFlag && profilesEnabledRemoteFlag;

  const { wallets } = useWallets();
  const {
    data: { mints, featuredMint },
    isFetching,
  } = useMints({ walletAddress: accountAddress });

  const hasHardwareWallets =
    Object.keys(wallets || {}).filter(
      key => wallets[key].type === walletTypes.bluetooth
    ).length > 0;

  return (
    <Inset top="20px" bottom={{ custom: 150 }}>
      <Stack space="20px">
        <Inset horizontal="20px">
          {!testNetwork ? (
            <Stack space="20px">
              <Inline space="20px">
                <GasCard />
                {isProfilesEnabled && <ENSSearchCard />}
              </Inline>
              {mintsEnabled && (mints?.length || isFetching) && (
                <Stack space="20px">
                  {!!featuredMint && <FeaturedMintCard />}
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
              <Inline space="20px">
                <LearnCard cardDetails={backupsCard} type="square" />
                <LearnCard cardDetails={avoidScamsCard} type="square" />
              </Inline>
              <DPICard />
            </Stack>
          ) : (
            <Stack space="20px">
              <Inline space="20px">
                <GasCard />
                <LearnCard cardDetails={cryptoAndWalletsCard} type="square" />
              </Inline>
              <DPICard />
            </Stack>
          )}
        </Inset>
        <Lists />
      </Stack>
    </Inset>
  );
}
