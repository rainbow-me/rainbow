import React from 'react';
import { RewardsSectionCard } from './RewardsSectionCard';
import { Stack, Text } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { CustomColor } from '@/design-system/color/useForegroundColor';
import { ButtonPressAnimation } from '@/components/animations';

type Props = {
  title: string;
  value: string;
  secondaryValue: string;
  secondaryValueIcon: string;
  secondaryValueColor: TextColor | CustomColor;
  onPress: () => void;
};

export const RewardsStatsCard: React.FC<Props> = ({
  title,
  value,
  secondaryValue,
  secondaryValueIcon,
  secondaryValueColor,
  onPress,
}) => (
  // TODO: Add explainer sheet navigation to on press here
  <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
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
  </ButtonPressAnimation>
);
