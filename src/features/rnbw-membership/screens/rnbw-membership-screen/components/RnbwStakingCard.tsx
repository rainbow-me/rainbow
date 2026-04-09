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

export const RnbwStakingCard = memo(function RnbwStakingCard() {
  const { tokenAmount, nativeCurrencyAmount, hasStakedPosition } = useRnbwStakingBalance();
  const { tokenAmountFormatted: availableAmount, hasMinimumStakeAmount } = useStakableRnbwBalance();

  return (
    <MembershipCard paddingHorizontal="20px" paddingTop="24px" paddingBottom="16px">
      <Box gap={16}>
        <Text size="22pt" weight="heavy" color="label">
          {'Stake'}
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
        {!hasStakedPosition && (
          <RnbwThemedButton
            onPress={hasMinimumStakeAmount ? navigateToStakingLearnSheet : navigateToBuyRnbw}
            label={hasMinimumStakeAmount ? 'Enable Staking' : 'Buy RNBW'}
          />
        )}
        {hasStakedPosition && (
          <Box flexDirection="row" gap={10}>
            <RnbwThemedButton
              onPress={navigateToUnstakeSheet}
              style={{ flex: 1 }}
              label="Unstake"
              size="22pt"
              weight="heavy"
              variant="secondary"
            />
            <RnbwThemedButton
              onPress={hasMinimumStakeAmount ? navigateToStakingScreen : navigateToBuyRnbw}
              style={{ flex: 1 }}
              label={hasMinimumStakeAmount ? 'Add' : 'Buy RNBW'}
            />
          </Box>
        )}
        <Box flexDirection="row" alignItems="center" justifyContent="center" gap={4}>
          <RnbwCoinIcon size={18} />
          <Text size="15pt" weight="bold" color="labelSecondary" align="center">
            {`${availableAmount}`}
          </Text>
          <Text size="15pt" weight="semibold" color="labelQuaternary" align="center">
            {'available to stake'}
          </Text>
        </Box>
      </Box>
    </MembershipCard>
  );
});

function navigateToStakingLearnSheet() {
  Navigation.handleAction(Routes.RNBW_STAKING_LEARN_SCREEN);
}

function navigateToStakingScreen() {
  Navigation.handleAction(Routes.RNBW_STAKING_SCREEN);
}

function navigateToUnstakeSheet() {
  Navigation.handleAction(Routes.RNBW_UNSTAKE_SHEET);
}
