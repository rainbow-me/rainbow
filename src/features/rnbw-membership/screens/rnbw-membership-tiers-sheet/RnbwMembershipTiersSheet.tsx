import { StyleSheet } from 'react-native';
import { StepIndicators } from '@/components/explainer-sheet/components/StepIndicators';
import { PanelSheet, PANEL_WIDTH } from '@/components/PanelSheet/PanelSheet';
import { downscalePagerIndex, SmoothPager, usePagerNavigation } from '@/components/SmoothPager/SmoothPager';
import { Box, globalColors, Separator, Text, useColorMode } from '@/design-system';
import { useMembershipTierInfo } from '../../stores/derived/useMembershipTierInfo';
import { memo } from 'react';
import type { Tier as TierType } from '../../types';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { RNBW_DECIMALS } from '@/features/rnbw-staking/constants';
import { convertRawAmountToDecimalFormat } from '@/helpers/utilities';
import { formatNumber } from '@/helpers/strings';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import { TierThemedLabel } from '../../components/TierThemedLabel';
import { TierBadge } from '../../components/TierBadge';
import { getTierVisuals } from '../../constants';
import { LinearGradient, type LinearGradientProps } from 'expo-linear-gradient';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { TierProgressBar } from '@/features/rnbw-membership/components/TierProgressBar';
import * as i18n from '@/languages';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const RnbwMembershipTiersSheet = memo(function RnbwMembershipTiersSheet() {
  const { isDarkMode, colorMode } = useColorMode();
  const { currentTier, allTiers } = useMembershipTierInfo();
  const { ref } = usePagerNavigation();
  const currentPageIndex = useDerivedValue(() => {
    return downscalePagerIndex(ref.current?.currentPageIndex.value ?? 0);
  });

  return (
    <PanelSheet>
      <Box paddingBottom={{ custom: 20 }} paddingTop={{ custom: 53 }} alignItems="center">
        {allTiers.map((tier, index) => (
          <TierGradientLayer
            key={tier.level}
            colors={getValueForColorMode(getTierVisuals(tier.level).backgroundGradient, colorMode).colors}
            index={index}
            pageIndex={currentPageIndex}
          />
        ))}
        <SmoothPager enableSwipeToGoBack={true} enableSwipeToGoForward={'always'} initialPage={currentTier.level} ref={ref}>
          {allTiers.map((tier, index) => (
            <SmoothPager.Page
              key={tier.level}
              component={<Tier tier={tier} tierIndex={index} tierCount={allTiers.length} />}
              id={tier.level}
            />
          ))}
        </SmoothPager>
        <StepIndicators
          stepCount={allTiers.length}
          currentIndex={currentPageIndex}
          color={isDarkMode ? globalColors.white100 : globalColors.grey100}
        />
      </Box>
    </PanelSheet>
  );
});

function Tier({ tier, tierIndex, tierCount }: { tier: TierType; tierIndex: number; tierCount: number }) {
  const stakeRequiredForTierDisplay = formatNumber(convertRawAmountToDecimalFormat(tier.minStakeAmount, RNBW_DECIMALS));
  const tierCashbackDisplay = `${tier.cashbackBps / 100}%`;

  return (
    <Box paddingBottom={{ custom: 42 }} paddingHorizontal={'32px'} width={PANEL_WIDTH}>
      <Box gap={32}>
        <TierBadge tier={tier} />
        <Box gap={20}>
          <TierThemedLabel tier={tier}>
            <Text size="34pt" weight="heavy" color="label" align="center">
              {i18n.t(i18n.l.rnbw_membership.shared.tier_label, { tierName: tier.name })}
            </Text>
          </TierThemedLabel>
          <Box flexDirection="row" justifyContent="center" gap={4}>
            <TierThemedLabel tier={tier}>
              <Text size="17pt" weight="heavy" color="label">
                {tierCashbackDisplay}
              </Text>
            </TierThemedLabel>
            <Text size="17pt" weight="semibold" color="labelTertiary">
              {i18n.t(i18n.l.rnbw_membership.shared.fee_cashback)}
            </Text>
          </Box>
        </Box>
        <TierProgressBar width={PANEL_WIDTH - 64} height={24} tier={tier} tierIndex={tierIndex} tierProgress={0} tierCount={tierCount} />
        <Box gap={16} paddingHorizontal={'8px'}>
          <Box flexDirection="row" justifyContent="space-between">
            <Text size="17pt" weight="semibold" color="labelTertiary">
              {i18n.t(i18n.l.rnbw_membership.shared.fee_cashback)}
            </Text>
            <Text size="17pt" weight="bold" color="label">
              {tierCashbackDisplay}
            </Text>
          </Box>
          <Separator thickness={1} color={'separatorTertiary'} />
          <Box flexDirection="row" justifyContent="space-between">
            <Text size="17pt" weight="semibold" color="labelTertiary">
              {i18n.t(i18n.l.rnbw_membership.membership_tiers_sheet.stake_to_unlock)}
            </Text>
            <Text size="17pt" weight="bold" color="label">
              {`${stakeRequiredForTierDisplay} ${RNBW_SYMBOL}`}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

const GRADIENT_START = { x: 0.5, y: 0 };
const GRADIENT_END = { x: 0.5, y: 0.31 };

function TierGradientLayer({
  colors,
  index,
  pageIndex,
}: {
  colors: LinearGradientProps['colors'];
  index: number;
  pageIndex: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pageIndex.value, [index - 1, index, index + 1], [0, 1, 0], Extrapolation.CLAMP),
  }));

  return <AnimatedLinearGradient colors={colors} start={GRADIENT_START} end={GRADIENT_END} style={[StyleSheet.absoluteFill, style]} />;
}
