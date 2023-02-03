import React from 'react';
import { RewardsSectionCard } from '@/screens/rewards/components/RewardsSectionCard';
import { Box, Column, Columns, Stack, Text } from '@/design-system';
import * as i18n from '@/languages';
import { useInfoIconColor } from '@/screens/rewards/hooks/useInfoIconColor';
import { RewardsProgressBar } from '@/screens/rewards/components/RewardsProgressBar';
import {
  addDays,
  differenceInDays,
  differenceInHours,
  fromUnixTime,
} from 'date-fns';
import { ButtonPressAnimation } from '@/components/animations';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToNativeDisplay,
} from '@/helpers/utilities';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';

type Props = {
  assetPrice?: number;
  color: string;
  nextDistributionTimestamp: number;
  remainingRewards: number;
  totalAvailableRewardsInToken: number;
};

export const RewardsAvailable: React.FC<Props> = ({
  assetPrice,
  color,
  nextDistributionTimestamp,
  remainingRewards,
  totalAvailableRewardsInToken,
}) => {
  const infoIconColor = useInfoIconColor();
  const nativeCurrency = useSelector(
    (state: AppState) => state.settings.nativeCurrency
  );
  const { navigate } = useNavigation();

  if (remainingRewards <= 0) {
    const formattedTotalAvailableRewards = assetPrice
      ? convertAmountAndPriceToNativeDisplay(
          totalAvailableRewardsInToken,
          assetPrice,
          nativeCurrency
        ).display
      : convertAmountToNativeDisplay(totalAvailableRewardsInToken, 'USD');

    const now = new Date();
    const nextDistribution = fromUnixTime(nextDistributionTimestamp);
    const days = differenceInDays(nextDistribution, now);
    const hours = differenceInHours(nextDistribution, addDays(now, days));

    const formattedTimeUntilNextDistribution =
      days > 0
        ? i18n.t(i18n.l.rewards.refreshes_in_with_days, {
            days,
            hours,
          })
        : i18n.t(i18n.l.rewards.refreshes_in_without_days, { hours });

    return (
      <Box paddingBottom="36px">
        <RewardsSectionCard>
          <Stack space="16px">
            <Stack space="8px">
              <Text size="20pt" weight="heavy" color="label">
                {i18n.t(i18n.l.rewards.all_rewards_claimed)}
              </Text>
              <RewardsProgressBar progress={1} color={color} />
            </Stack>
            <Text size="13pt" weight="semibold" color={{ custom: color }}>
              {i18n.t(i18n.l.rewards.rainbow_users_claimed, {
                amount: formattedTotalAvailableRewards,
              })}
            </Text>
            <Text size="13pt" weight="semibold" color="labelQuaternary">
              {formattedTimeUntilNextDistribution}
            </Text>
          </Stack>
        </RewardsSectionCard>
      </Box>
    );
  } else {
    const progress = remainingRewards / totalAvailableRewardsInToken;
    const roundedProgressPercent = Math.round(progress * 10) * 10;

    const navigateToAmountsExplainer = () => {
      navigate(Routes.EXPLAIN_SHEET, { type: 'op_rewards_amount_distributed' });
    };

    return (
      <Box paddingBottom="36px">
        <ButtonPressAnimation
          onPress={navigateToAmountsExplainer}
          scaleTo={0.96}
          overflowMargin={50}
        >
          <RewardsSectionCard>
            <Stack space="16px">
              <Stack space="12px">
                <Columns alignVertical="center">
                  <Text size="15pt" weight="semibold" color="labelSecondary">
                    {i18n.t(i18n.l.rewards.total_available_rewards)}
                  </Text>
                  <Column width="content">
                    <Text
                      size="15pt"
                      weight="semibold"
                      color={{ custom: infoIconColor }}
                    >
                      􀅵
                    </Text>
                  </Column>
                </Columns>
                <RewardsProgressBar progress={progress} color={color} />
              </Stack>
              <Columns alignVertical="center">
                <Text size="13pt" weight="semibold" color={{ custom: color }}>
                  {i18n.t(i18n.l.rewards.left_this_week, {
                    percent: roundedProgressPercent,
                  })}
                </Text>
                <Column width="content">
                  <Text size="13pt" weight="semibold" color="labelTertiary">
                    {i18n.t(i18n.l.rewards.refreshes_next_week)}
                  </Text>
                </Column>
              </Columns>
            </Stack>
          </RewardsSectionCard>
        </ButtonPressAnimation>
      </Box>
    );
  }
};
