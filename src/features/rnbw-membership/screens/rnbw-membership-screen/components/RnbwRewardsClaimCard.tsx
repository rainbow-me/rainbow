import { memo } from 'react';
import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import { RnbwClaimCard } from '@/features/rnbw-membership/screens/rnbw-membership-screen/components/RnbwClaimCard';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

export const RnbwRewardsClaimCard = memo(function RnbwRewardsClaimCard() {
  const hasClaimableRewards = useRewardsBalanceStore(state => state.hasClaimableRewards());
  const { tokenAmount: rewardsTokenAmount, nativeCurrencyAmount: rewardsNativeAmount } = useRewardsBalanceStore(state =>
    state.getFormattedBalance()
  );

  if (!hasClaimableRewards) return null;

  return (
    <RnbwClaimCard
      tokenAmount={rewardsTokenAmount}
      nativeCurrencyAmount={rewardsNativeAmount}
      title={i18n.t(i18n.l.rnbw_membership.claim_card.rewards)}
      onPressClaim={navigateToRewardsScreen}
    />
  );
});

function navigateToRewardsScreen() {
  Navigation.handleAction(Routes.RNBW_REWARDS_SCREEN);
}
