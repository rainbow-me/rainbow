import { memo } from 'react';
import { Text, Box } from '@/design-system';
import { useRnbwStakingBalance } from '@/features/rnbw-staking/stores/derived/useRnbwStakingBalance';
import { useStakableRnbwBalance } from '@/state/rnbw/useStakableRnbwBalance';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { RnbwCoinIcon } from '@/components/RnbwCoinIcon';
import { MembershipCard } from './MembershipCard';
import { RnbwThemedButton } from '@/features/rnbw-membership/components/RnbwThemedButton';
import { navigateToBuyRnbw } from '@/features/rnbw-membership/utils/navigateToBuyRnbw';
import { blockRnbwStakingAccessIfNeeded } from '@/features/rnbw-staking/utils/blockStakingAccessIfNeeded';
import * as i18n from '@/languages';
import { MIN_STAKE_AMOUNT } from '@/features/rnbw-staking/constants';

export const RnbwStakingCard = memo(function RnbwStakingCard() {
  const { tokenAmount, nativeCurrencyAmount, hasStakedPosition } = useRnbwStakingBalance();
  const { tokenAmountFormatted: availableAmount, hasMinimumStakeAmount } = useStakableRnbwBalance();

  return (
    <MembershipCard paddingHorizontal="20px" paddingTop="24px" paddingBottom="16px">
      <Box gap={16}>
        <Text size="22pt" weight="heavy" color="label">
          {i18n.t(i18n.l.rnbw_membership.staking_card.stake)}
        </Text>
        <Box alignItems="center" gap={20}>
          <RnbwCoinIcon size={80} />
          <Text size="44pt" weight="heavy" color="label">
            {nativeCurrencyAmount}
          </Text>
          <Text size="17pt" weight="bold" color="labelTertiary">
            {`${tokenAmount} ${RNBW_SYMBOL}`}
          </Text>
        </Box>
        {hasStakedPosition ? (
          <Box flexDirection="row" gap={10}>
            <RnbwThemedButton
              onPress={navigateToUnstakeSheet}
              style={{ flex: 1 }}
              label={i18n.t(i18n.l.rnbw_membership.staking_card.unstake)}
              size="22pt"
              weight="heavy"
              variant="secondary"
            />
            <RnbwThemedButton
              onPress={hasMinimumStakeAmount ? navigateToStakingScreen : navigateToBuyRnbw}
              style={{ flex: 1 }}
              label={hasMinimumStakeAmount ? i18n.t(i18n.l.button.add) : i18n.t(i18n.l.rnbw_membership.staking_card.buy_rnbw)}
            />
          </Box>
        ) : (
          <RnbwThemedButton
            onPress={hasMinimumStakeAmount ? navigateToStakingLearnSheet : navigateToBuyRnbw}
            label={
              hasMinimumStakeAmount
                ? i18n.t(i18n.l.rnbw_membership.staking_card.enable_staking)
                : i18n.t(i18n.l.rnbw_membership.staking_card.buy_rnbw)
            }
          />
        )}
        <Box flexDirection="row" alignItems="center" justifyContent="center" gap={4}>
          <RnbwCoinIcon size={18} />
          <Text size="15pt" weight="bold" color="labelSecondary" align="center">
            {availableAmount}
          </Text>
          <Text size="15pt" weight="semibold" color="labelQuaternary" align="center">
            {i18n.t(
              hasStakedPosition
                ? i18n.l.rnbw_membership.staking_card.available_to_add
                : i18n.l.rnbw_membership.staking_card.available_to_stake
            )}
          </Text>
        </Box>
        {!hasMinimumStakeAmount && (
          <Text size="15pt" weight="semibold" color="labelQuaternary" align="center">
            {i18n.t(i18n.l.rnbw_membership.staking_card.minimum_stake_amount_required, { minStakeAmount: MIN_STAKE_AMOUNT })}
          </Text>
        )}
      </Box>
    </MembershipCard>
  );
});

function navigateToStakingLearnSheet() {
  if (blockRnbwStakingAccessIfNeeded()) {
    return;
  }
  Navigation.handleAction(Routes.RNBW_STAKING_LEARN_SCREEN);
}

function navigateToStakingScreen() {
  if (blockRnbwStakingAccessIfNeeded()) {
    return;
  }
  Navigation.handleAction(Routes.RNBW_STAKING_SCREEN);
}

function navigateToUnstakeSheet() {
  if (blockRnbwStakingAccessIfNeeded()) {
    return;
  }
  Navigation.handleAction(Routes.RNBW_UNSTAKE_SHEET);
}
