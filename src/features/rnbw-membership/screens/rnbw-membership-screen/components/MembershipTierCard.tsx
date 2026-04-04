import { memo } from 'react';
import { Box, Separator, Text, TextIcon } from '@/design-system';
import { useMembershipTierInfo } from '@/features/rnbw-membership/stores/derived/useMembershipTierInfo';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { MembershipCard } from '@/features/rnbw-membership/screens/rnbw-membership-screen/components/MembershipCard';
import { TierThemedLabel } from '@/features/rnbw-membership/components/TierThemedLabel';
import { TierProgressBar } from '@/features/rnbw-membership/components/TierProgressBar';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import * as i18n from '@/languages';

export const MembershipTierCard = memo(function MembershipTierCard() {
  const { currentTier, currentTierIndex, currentTierProgress, stakeRequiredForNextTier, cashbackPercentage, allTiers } =
    useMembershipTierInfo();

  return (
    <ButtonPressAnimation onPress={navigateToMembershipTiersSheet} scaleTo={0.96}>
      <MembershipCard paddingHorizontal="20px" paddingVertical="24px">
        <Box position="absolute" top={{ custom: 24 }} right={{ custom: 20 }}>
          <TextIcon size="icon 17px" weight="bold" color="labelQuaternary">
            {'􀅴'}
          </TextIcon>
        </Box>
        <Box gap={16}>
          <TierThemedLabel tier={currentTier}>
            <Text size="22pt" weight="heavy" color="label">
              {i18n.t(i18n.l.rnbw_membership.shared.tier_label, { tierName: currentTier.name })}
            </Text>
          </TierThemedLabel>
          <TierProgressBar
            width={DEVICE_WIDTH - 80}
            height={24}
            tier={currentTier}
            tierIndex={currentTierIndex}
            tierProgress={currentTierProgress}
            tierCount={allTiers.length}
          />
          <Box gap={16} paddingHorizontal={'4px'}>
            <Box flexDirection="row" justifyContent="space-between">
              <Text size="17pt" weight="semibold" color="labelTertiary">
                {i18n.t(i18n.l.rnbw_membership.shared.fee_cashback)}
              </Text>
              <Text size="17pt" weight="bold" color="label">
                {`${cashbackPercentage}%`}
              </Text>
            </Box>
            <Separator color="separatorTertiary" thickness={1} />
            <Box flexDirection="row" justifyContent="space-between">
              <Text size="17pt" weight="semibold" color="labelTertiary">
                {i18n.t(i18n.l.rnbw_membership.membership_tier_card.stake_to_next_tier)}
              </Text>
              <Text size="17pt" weight="bold" color="label">
                {`${stakeRequiredForNextTier} ${RNBW_SYMBOL}`}
              </Text>
            </Box>
          </Box>
        </Box>
      </MembershipCard>
    </ButtonPressAnimation>
  );
});

function navigateToMembershipTiersSheet() {
  Navigation.handleAction(Routes.RNBW_MEMBERSHIP_TIERS_SHEET);
}
