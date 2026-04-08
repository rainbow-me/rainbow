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
import { opacity } from '@/framework/ui/utils/opacity';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import { TierThemedLabel } from '../../components/TierThemedLabel';
import { TierBadge } from '../../components/TierBadge';
import { TIER_VISUALS } from '../../constants';
import { LinearGradient, type LinearGradientProps } from 'expo-linear-gradient';
import { getValueForColorMode } from '@/design-system/color/palettes';

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
            colors={getValueForColorMode(TIER_VISUALS[tier.level].backgroundGradient, colorMode).colors}
            index={index}
            pageIndex={currentPageIndex}
          />
        ))}
        <SmoothPager enableSwipeToGoBack={true} enableSwipeToGoForward={'always'} initialPage={currentTier.level} ref={ref}>
          {allTiers.map(tier => (
            <SmoothPager.Page key={tier.level} component={<Tier tier={tier} />} id={tier.level} />
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

function Tier({ tier }: { tier: TierType }) {
  const stakeRequiredForTierDisplay = formatNumber(convertRawAmountToDecimalFormat(tier.minStakeAmount, RNBW_DECIMALS));
  const tierCashbackDisplay = `${tier.cashbackBps / 100}%`;

  return (
    <Box paddingBottom={{ custom: 42 }} paddingHorizontal={'32px'} width={PANEL_WIDTH}>
      <Box gap={32}>
        <TierBadge tier={tier} />
        <Box gap={20}>
          <TierThemedLabel tier={tier}>
            <Text size="34pt" weight="heavy" color="label" align="center">
              {`${tier.name} Tier`}
            </Text>
          </TierThemedLabel>
          <Box flexDirection="row" justifyContent="center" gap={4}>
            <TierThemedLabel tier={tier}>
              <Text size="17pt" weight="heavy" color="label">
                {tierCashbackDisplay}
              </Text>
            </TierThemedLabel>
            <Text size="17pt" weight="semibold" color="labelTertiary">
              {'Rewards'}
            </Text>
          </Box>
        </Box>
        <Box gap={16} paddingHorizontal={'8px'}>
          <Box flexDirection="row" justifyContent="space-between">
            <Text size="17pt" weight="semibold" color="labelTertiary">
              {'Rewards'}
            </Text>
            <Text size="17pt" weight="bold" color="label">
              {tierCashbackDisplay}
            </Text>
          </Box>
          <Separator thickness={1} color={{ custom: opacity(globalColors.grey100, 0.04) }} />
          <Box flexDirection="row" justifyContent="space-between">
            <Text size="17pt" weight="semibold" color="labelTertiary">
              {'Stake to unlock'}
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
