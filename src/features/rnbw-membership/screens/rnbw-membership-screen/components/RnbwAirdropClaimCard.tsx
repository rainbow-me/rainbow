import { useAirdropBalanceStore } from '@/features/rnbw-rewards/stores/airdropBalanceStore';
import { memo } from 'react';
import { RnbwClaimCard } from '@/features/rnbw-membership/screens/rnbw-membership-screen/components/RnbwClaimCard';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

export const RnbwAirdropClaimCard = memo(function RnbwAirdropClaimCard() {
  const hasClaimableAirdrop = useAirdropBalanceStore(state => state.hasClaimableAirdrop());
  const { tokenAmount: airdropTokenAmount, nativeCurrencyAmount: airdropNativeAmount } = useAirdropBalanceStore(state =>
    state.getFormattedBalance()
  );

  if (!hasClaimableAirdrop) return null;

  return (
    <RnbwClaimCard
      tokenAmount={airdropTokenAmount}
      nativeCurrencyAmount={airdropNativeAmount}
      title={i18n.t(i18n.l.rnbw_membership.claim_card.airdrop)}
      onPressClaim={navigateToAirdropScreen}
    />
  );
});

function navigateToAirdropScreen() {
  Navigation.handleAction(Routes.RNBW_AIRDROP_SCREEN);
}
