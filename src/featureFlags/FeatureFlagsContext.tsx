import React, {
  Dispatch,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { noop } from 'lodash';
import {
  CROSSCHAIN_SWAPS,
  DEFI_POSITIONS,
  FLASHBOTS_WC,
  HARDWARE_WALLETS,
  LANGUAGE_SETTINGS,
  LOG_PUSH,
  MINTS,
  NFT_OFFERS,
  NOTIFICATIONS,
  OP_REWARDS,
  POINTS,
  POINTS_NOTIFICATIONS_TOGGLE,
  PROFILES,
  REMOTE_CARDS,
  REMOTE_PROMO_SHEETS,
  defaultConfig as localConfig,
} from '@/config/experimental';
import { useRemoteConfig } from '@/model/remoteConfig';

type FeatureFlagsContext = {
  profilesEnabled: boolean;
};

const FeatureFlagsContext = createContext<FeatureFlagsContext>({
  profilesEnabled: false,
});

export const useFeatureFlags = () => useContext(FeatureFlagsContext);

export const FeatureFlagsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const remoteConfig = useRemoteConfig();

  return (
    <FeatureFlagsContext.Provider
      value={{
        profilesEnabled:
          remoteConfig.profiles_enabled || localConfig[PROFILES].value,
        flashbotsEnabled:
          remoteConfig.flashbots_enabled || localConfig[FLASHBOTS_WC].value,
        hardwareWalletsEnabled: localConfig[HARDWARE_WALLETS].value,
        languageSelectionEnabled: localConfig[LANGUAGE_SETTINGS].value,
        notificationsEnabled: localConfig[NOTIFICATIONS].value,
        crosschainSwapsEnabled: localConfig[CROSSCHAIN_SWAPS].value,
        opRewardsEnabled:
          remoteConfig.op_rewards_enabled || localConfig[OP_REWARDS].value,
        logPushEnabled: localConfig[LOG_PUSH].value,
        defiPositionsEnabled: localConfig[DEFI_POSITIONS].value,
        nftOffersEnabled: localConfig[NFT_OFFERS].value,
        mintsEnabled: remoteConfig.mints_enabled || localConfig[MINTS].value,
        pointsEnabled: remoteConfig.points_enabled || localConfig[POINTS].value,
        remotePromoSheetsEnabled:
          remoteConfig.remote_promo_enabled ||
          localConfig[REMOTE_PROMO_SHEETS].value,
        remoteCardsEnabled:
          remoteConfig.remote_cards_enabled || localConfig[REMOTE_CARDS].value,
        pointsNotificationToggleEnabled:
          remoteConfig.points_notifications_toggle ||
          localConfig[POINTS_NOTIFICATIONS_TOGGLE].value,
        fiatToCryptoEnabled: remoteConfig.f2c_enabled,
        swapAggregatorEnabled: remoteConfig.swagg_enabled,
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
};
