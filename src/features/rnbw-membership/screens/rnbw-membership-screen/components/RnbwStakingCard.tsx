import { memo, useCallback, useState } from 'react';
import { PixelRatio, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { RnbwCoinIcon } from '@/components/RnbwCoinIcon';
import { Box, Text } from '@/design-system';
import { MembershipTierButton } from '@/features/rnbw-membership/components/MembershipTierButton/MembershipTierButton';
import { TierBadge } from '@/features/rnbw-membership/components/TierBadge';
import { useMembershipTierInfo } from '@/features/rnbw-membership/stores/derived/useMembershipTierInfo';
import { navigateToBuyRnbw } from '@/features/rnbw-membership/utils/navigateToBuyRnbw';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import { useRnbwStakingBalance } from '@/features/rnbw-staking/stores/derived/useRnbwStakingBalance';
import { useStakingPositionStore } from '@/features/rnbw-staking/stores/rnbwStakingPositionStore';
import { blockRnbwStakingAccessIfNeeded } from '@/features/rnbw-staking/utils/blockStakingAccessIfNeeded';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useStakableRnbwBalance } from '@/state/rnbw/useStakableRnbwBalance';
import { THICK_BORDER_WIDTH } from '@/styles/constants';

import { MembershipCardSkeleton } from './MembershipCardSkeleton';
import { NotchedMembershipCard } from './NotchedMembershipCard';

type RnbwStakingCardProps = {
  width: number;
};

const TIER_BADGE_NOTCH_HORIZONTAL_PADDING = 12;
export const TIER_BADGE_HEIGHT = 36;

export const RnbwStakingCard = memo(function RnbwStakingCard({ width }: RnbwStakingCardProps) {
  const showPositionSkeleton = useStakingPositionStore(state => state.getStatus('isInitialLoad') && !state.getData());
  const { currentTier } = useMembershipTierInfo();
  const { tokenAmount, nativeCurrencyAmount, hasStakedPosition } = useRnbwStakingBalance();
  const { tokenAmountFormatted: availableAmount, hasMinimumStakeAmount } = useStakableRnbwBalance();
  const [measuredTierBadgeWidth, setMeasuredTierBadgeWidth] = useState<number | null>(null);

  const handleTierBadgeLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = PixelRatio.roundToNearestPixel(event.nativeEvent.layout.width);
    setMeasuredTierBadgeWidth(width => (width === nextWidth ? width : nextWidth));
  }, []);

  if (showPositionSkeleton) {
    return <MembershipCardSkeleton width={width} height={319} />;
  }

  return (
    <NotchedMembershipCard
      width={width}
      notchWidth={measuredTierBadgeWidth === null ? null : measuredTierBadgeWidth + TIER_BADGE_NOTCH_HORIZONTAL_PADDING * 2}
      notchOverlay={
        <ButtonPressAnimation onPress={navigateToMembershipTiersSheet}>
          <View onLayout={handleTierBadgeLayout}>
            <TierBadge tier={currentTier} height={36} fontSize="17pt" borderWidth={THICK_BORDER_WIDTH} paddingHorizontal={14} />
          </View>
        </ButtonPressAnimation>
      }
      paddingTop={'24px'}
      paddingHorizontal="24px"
      paddingBottom="16px"
    >
      <Box gap={16}>
        <Text size="22pt" weight="heavy" color="label">
          {i18n.t(i18n.l.rnbw_membership.staking_card.stake)}
        </Text>
        <Box gap={24}>
          <Box alignItems="center" gap={20}>
            <RnbwCoinIcon size={80} />
            <Box alignItems="center" gap={16}>
              <Text size="44pt" weight="heavy" color="label">
                {nativeCurrencyAmount}
              </Text>
              <Text size="17pt" weight="bold" color="labelTertiary">
                {`${tokenAmount} ${RNBW_SYMBOL}`}
              </Text>
            </Box>
          </Box>
          <Box gap={12}>
            {hasStakedPosition ? (
              <Box flexDirection="row" gap={10} height={44}>
                <MembershipTierButton
                  tier={currentTier}
                  onPress={navigateToUnstakeSheet}
                  style={styles.flexButton}
                  label={i18n.t(i18n.l.rnbw_membership.staking_card.unstake)}
                  variant="secondary"
                />
                <MembershipTierButton
                  tier={currentTier}
                  onPress={hasMinimumStakeAmount ? navigateToStakingScreen : navigateToBuyRnbw}
                  style={styles.flexButton}
                  label={hasMinimumStakeAmount ? i18n.t(i18n.l.button.add) : i18n.t(i18n.l.rnbw_membership.staking_card.buy)}
                />
              </Box>
            ) : (
              <MembershipTierButton
                tier={currentTier}
                onPress={hasMinimumStakeAmount ? navigateToStakingLearnSheet : navigateToBuyRnbw}
                label={
                  hasMinimumStakeAmount
                    ? i18n.t(i18n.l.rnbw_membership.staking_card.enable_staking)
                    : i18n.t(i18n.l.rnbw_membership.staking_card.buy)
                }
              />
            )}
            {hasMinimumStakeAmount ? (
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
            ) : (
              <Box flexDirection="row" alignItems="center" justifyContent="center" gap={4}>
                <Text size="15pt" weight="semibold" color="labelQuaternary" align="center">
                  {i18n.t(i18n.l.rnbw_membership.staking_card.buy_more)}
                </Text>
                <RnbwCoinIcon size={18} />
                <Text size="15pt" weight="bold" color="labelSecondary" align="center">
                  {RNBW_SYMBOL}
                </Text>
                <Text size="15pt" weight="semibold" color="labelQuaternary" align="center">
                  {i18n.t(
                    hasStakedPosition ? i18n.l.rnbw_membership.staking_card.to_add_to_stake : i18n.l.rnbw_membership.staking_card.to_stake
                  )}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </NotchedMembershipCard>
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

function navigateToMembershipTiersSheet() {
  Navigation.handleAction(Routes.RNBW_MEMBERSHIP_TIERS_SHEET);
}

const styles = StyleSheet.create({
  flexButton: {
    flex: 1,
  },
});
