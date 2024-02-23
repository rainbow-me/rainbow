import React from 'react';
import { RewardsSectionCard } from './RewardsSectionCard';
import { Inline, Stack, Text } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { CustomColor } from '@/design-system/color/useForegroundColor';
import { ButtonPressAnimation } from '@/components/animations';
import { useInfoIconColor } from '@/screens/rewards/hooks/useInfoIconColor';

type Props = {
  title: string;
  value: string;
  secondaryValue: string;
  secondaryValueIcon: string;
  secondaryValueColor: TextColor | CustomColor;
  onPress?: () => void;
};

export const RewardsStatsCard: React.FC<Props> = ({ title, value, secondaryValue, secondaryValueIcon, secondaryValueColor, onPress }) => {
  const infoIconColor = useInfoIconColor();

  return (
    <ButtonPressAnimation disabled={!onPress} onPress={onPress} scaleTo={0.96} overflowMargin={50}>
      <RewardsSectionCard>
        <Stack space="12px">
          <Inline space="4px" alignVertical="center" wrap={false}>
            <Text size="15pt" color="labelTertiary" weight="semibold">
              {title}
            </Text>
            <Text size="13pt" weight="heavy" color={{ custom: infoIconColor }}>
              􀅵
            </Text>
          </Inline>
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
};
