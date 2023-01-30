import React from 'react';
import { RewardsSectionCard } from './RewardsSectionCard';
import { Stack, Text } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { CustomColor } from '@/design-system/color/useForegroundColor';

type Props = {
  title: string;
  value: string;
  secondaryValue: string;
  secondaryValueIcon: string;
  secondaryValueColor: TextColor | CustomColor;
};

export const RewardsStatsCard: React.FC<Props> = ({
  title,
  value,
  secondaryValue,
  secondaryValueIcon,
  secondaryValueColor,
}) => (
  <RewardsSectionCard>
    <Stack space="12px">
      <Text size="15pt" color="labelTertiary" weight="semibold">
        {title}
      </Text>
      <Text size="22pt" color="label" weight="bold">
        {value}
      </Text>
      <Text size="13pt" color={secondaryValueColor} weight="bold">
        <Text size="12pt" weight="bold" color={secondaryValueColor}>
          {secondaryValueIcon + ' '}
        </Text>
        {secondaryValue}
      </Text>
    </Stack>
  </RewardsSectionCard>
);
