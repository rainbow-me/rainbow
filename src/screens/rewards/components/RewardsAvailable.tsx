import React from 'react';
import { RewardsSectionCard } from '@/screens/rewards/components/RewardsSectionCard';
import { Box, Column, Columns, Stack, Text } from '@/design-system';
import * as i18n from '@/languages';
import { useInfoIconColor } from '@/screens/rewards/hooks/useInfoIconColor';
import { RewardsProgressBar } from '@/screens/rewards/components/RewardsProgressBar';

type Props = {
  totalAvailableRewards: number;
  remainingRewards: number;
  color: string;
};

export const RewardsAvailable: React.FC<Props> = ({
  remainingRewards,
  totalAvailableRewards,
  color,
}) => {
  const infoIconColor = useInfoIconColor();
  const progress = remainingRewards / totalAvailableRewards;
  const roundedProgress = Math.round(progress * 10) * 10;
  const leftThisWeekLabel = `~${roundedProgress}% ${i18n.t(
    i18n.l.rewards.left_this_week
  )}`;

  return (
    <Box paddingBottom="36px">
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
              {leftThisWeekLabel}
            </Text>
            <Column width="content">
              <Text size="13pt" weight="semibold" color="labelTertiary">
                {i18n.t(i18n.l.rewards.refreshes_next_week)}
              </Text>
            </Column>
          </Columns>
        </Stack>
      </RewardsSectionCard>
    </Box>
  );
};
