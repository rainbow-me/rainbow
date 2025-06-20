import { OnboardPointsMutation, PointsErrorType, PointsOnboardingCategory } from '@/graphql/__generated__/metadataPOST';
import { WrappedAlert as Alert } from '@/helpers/alert';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';
import { pointsQueryKey } from '@/resources/points';
import { noop } from 'lodash';
import React, { Dispatch, SetStateAction, createContext, useCallback, useContext, useMemo, useState } from 'react';
import { RainbowPointsFlowSteps, buildTwitterIntentMessage } from '../constants';

import { analytics } from '@/analytics';
import { metadataPOSTClient } from '@/graphql';
import { getProvider } from '@/handlers/web3';
import { RainbowError, logger } from '@/logger';
import { loadWallet, signPersonalMessage } from '@/model/wallet';
import { useNavigation } from '@/navigation';
import { queryClient } from '@/react-query';
import { ChainId } from '@/state/backendNetworks/types';
import { useAccountAddress, useIsHardwareWallet } from '@/state/wallets/walletsStore';
import { delay } from '@/utils/delay';

type PointsProfileContext = {
  step: RainbowPointsFlowSteps;
  setStep: Dispatch<SetStateAction<RainbowPointsFlowSteps>>;
  profile: OnboardPointsMutation | undefined;
  setProfile: Dispatch<SetStateAction<OnboardPointsMutation | undefined>>;
  referralCode: string | undefined;
  setReferralCode: Dispatch<SetStateAction<string | undefined>>;
  deeplinked: boolean;
  setDeeplinked: Dispatch<SetStateAction<boolean>>;
  intent: string | undefined;
  animationKey: number;
  setAnimationKey: Dispatch<SetStateAction<number>>;

  signIn: () => Promise<void>;

  rainbowSwaps: PointsOnboardingCategory | undefined;
  metamaskSwaps: PointsOnboardingCategory | undefined;
  rainbowBridges: PointsOnboardingCategory | undefined;
  nftCollections: PointsOnboardingCategory | undefined;
  historicBalance: PointsOnboardingCategory | undefined;
  bonus: PointsOnboardingCategory | undefined;

  hasRetroActivePoints: number | undefined;
};

const enum PointsOnboardingCategoryType {
  RainbowSwaps = 'rainbow-swaps',
  MetamaskSwaps = 'metamask-swaps',
  RainbowBridges = 'rainbow-bridges',
  NFTCollections = 'nft-collections',
  HistoricBalance = 'historic-balance',
  Bonus = 'bonus',
}

const PointsProfileContext = createContext<PointsProfileContext>({
  step: RainbowPointsFlowSteps.Initialize,
  setStep: noop,
  profile: undefined,
  setProfile: noop,
  referralCode: undefined,
  setReferralCode: noop,
  deeplinked: false,
  setDeeplinked: noop,
  intent: undefined,
  animationKey: 0,
  setAnimationKey: noop,

  signIn: async () => void 0,

  // helpers
  rainbowSwaps: undefined,
  metamaskSwaps: undefined,
  rainbowBridges: undefined,
  nftCollections: undefined,
  historicBalance: undefined,
  bonus: undefined,
  hasRetroActivePoints: 0,
});

export const usePointsProfileContext = () => useContext(PointsProfileContext);

export const PointsProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const accountAddress = useAccountAddress();
  const isHardwareWallet = useIsHardwareWallet();
  const { navigate, goBack } = useNavigation();

  const [step, setStep] = useState<RainbowPointsFlowSteps>(RainbowPointsFlowSteps.Initialize);
  const [profile, setProfile] = useState<OnboardPointsMutation | undefined>();
  const [referralCode, setReferralCode] = useState<string>();
  const [deeplinked, setDeeplinked] = useState<boolean>(false);
  const [animationKey, setAnimationKey] = useState(0);

  const rainbowSwaps = profile?.onboardPoints?.user?.onboarding?.categories?.find(
    ({ type }) => type === PointsOnboardingCategoryType.RainbowSwaps
  );
  const metamaskSwaps = profile?.onboardPoints?.user?.onboarding?.categories?.find(
    ({ type }) => type === PointsOnboardingCategoryType.MetamaskSwaps
  );
  const rainbowBridges = profile?.onboardPoints?.user?.onboarding?.categories?.find(
    ({ type }) => type === PointsOnboardingCategoryType.RainbowBridges
  );
  const nftCollections = profile?.onboardPoints?.user?.onboarding?.categories?.find(
    ({ type }) => type === PointsOnboardingCategoryType.NFTCollections
  );
  const historicBalance = profile?.onboardPoints?.user?.onboarding?.categories?.find(
    ({ type }) => type === PointsOnboardingCategoryType.HistoricBalance
  );
  const bonus = profile?.onboardPoints?.user?.onboarding?.categories?.find(({ type }) => type === PointsOnboardingCategoryType.Bonus);

  const hasRetroActivePoints =
    rainbowSwaps?.earnings?.total ||
    metamaskSwaps?.earnings?.total ||
    rainbowBridges?.earnings?.total ||
    nftCollections?.earnings?.total ||
    historicBalance?.earnings?.total;

  const signIn = useCallback(async () => {
    analytics.track(analytics.event.pointsOnboardingScreenPressedSignInButton, {
      deeplinked,
      referralCode: !!referralCode,
      hardwareWallet: isHardwareWallet,
    });

    try {
      const challengeResponse = await metadataPOSTClient.getPointsOnboardChallenge({
        address: accountAddress,
        referral: referralCode,
      });
      const challenge = challengeResponse?.pointsOnboardChallenge;
      if (!challenge) {
        Alert.alert(i18n.t(i18n.l.points.console.generic_alert));
        throw new RainbowError('Points: Error getting onboard challenge');
      }
      const provider = getProvider({ chainId: ChainId.mainnet });
      const wallet = await loadWallet({ address: accountAddress, provider });
      if (!wallet) {
        Alert.alert(i18n.t(i18n.l.points.console.generic_alert));
        throw new RainbowError('Points: Error loading wallet');
      }
      const signatureResponse = await signPersonalMessage(challenge, provider, wallet);
      if (signatureResponse && isHardwareWallet) {
        goBack();
      }
      const signature = signatureResponse?.result;
      if (!signature) {
        Alert.alert(i18n.t(i18n.l.points.console.generic_alert));
        throw new RainbowError('Points: Error signing challenge');
      }
      const points = await metadataPOSTClient.onboardPoints({
        address: accountAddress,
        signature,
        referral: referralCode,
      });
      if (!points || !points.onboardPoints) {
        Alert.alert(i18n.t(i18n.l.points.console.generic_alert));
        throw new RainbowError('Points: Error onboarding user');
      }

      const errorType = points.onboardPoints?.error?.type;
      if (errorType) {
        switch (errorType) {
          case PointsErrorType.ExistingUser:
            Alert.alert(i18n.t(i18n.l.points.console.existing_user_alert));
            break;
          case PointsErrorType.InvalidReferralCode:
            Alert.alert(i18n.t(i18n.l.points.console.invalid_referral_code_alert));
            break;
          case PointsErrorType.NoBalance:
            setAnimationKey(prevKey => prevKey + 1);
            setStep(RainbowPointsFlowSteps.RequireWalletBalance);
            break;
          default:
            Alert.alert(i18n.t(i18n.l.points.console.generic_alert));
            break;
        }
        logger.error(new RainbowError('[PointsProfileContext]: Failed to onboard user'), { errorType });
        analytics.track(analytics.event.pointsOnboardingScreenFailedToSignIn, {
          deeplinked,
          referralCode: !!referralCode,
          hardwareWallet: isHardwareWallet,
          errorType,
        });
        return;
      }
      analytics.track(analytics.event.pointsOnboardingScreenSuccessfullySignedIn, {
        deeplinked,
        referralCode: !!referralCode,
        hardwareWallet: isHardwareWallet,
      });
      setProfile(points);
      const queryKey = pointsQueryKey({ address: accountAddress });
      queryClient.setQueryData(queryKey, points);
      delay(5000).then(() => queryClient.refetchQueries(queryKey));
    } catch (error) {
      analytics.track(analytics.event.pointsOnboardingScreenFailedToSignIn, {
        deeplinked,
        referralCode: !!referralCode,
        hardwareWallet: isHardwareWallet,
        errorType: undefined,
      });
      logger.error(new RainbowError('[PointsProfileContext]: signIn error'), { error });
    }
  }, [accountAddress, deeplinked, goBack, isHardwareWallet, referralCode]);

  const signInHandler = useCallback(async () => {
    if (isHardwareWallet) {
      navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, { submit: signIn });
    } else {
      signIn();
    }
  }, [isHardwareWallet, navigate, signIn]);

  const intent = useMemo(() => {
    return buildTwitterIntentMessage(profile, metamaskSwaps);
  }, [profile, metamaskSwaps]);

  return (
    <PointsProfileContext.Provider
      value={{
        // internals
        step,
        setStep,
        profile,
        setProfile,
        referralCode,
        setReferralCode,
        deeplinked,
        setDeeplinked,
        intent,
        animationKey,
        setAnimationKey,

        // functions
        signIn: signInHandler,

        // helpers
        rainbowSwaps,
        metamaskSwaps,
        rainbowBridges,
        nftCollections,
        historicBalance,
        bonus,
        hasRetroActivePoints,
      }}
    >
      {children}
    </PointsProfileContext.Provider>
  );
};
