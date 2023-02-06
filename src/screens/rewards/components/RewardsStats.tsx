import React from 'react';
import { Bleed, Box, Inline, Stack, Text } from '@/design-system';
import * as i18n from '@/languages';
import { ScrollView } from 'react-native';
import { RewardsStatsCard } from './RewardsStatsCard';
import { capitalize } from 'lodash';
import {
  RewardStatsAction,
  RewardStatsActionType,
} from '@/graphql/__generated__/metadata';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

type Props = {
  position: number;
  positionChange: number;
  actions: RewardStatsAction[];
  color: string;
};

export const RewardsStats: React.FC<Props> = ({
  actions,
  position,
  positionChange,
  color,
}) => {
  const { navigate } = useNavigation();
  const navigateToPositionExplainer = () => {
    navigate(Routes.EXPLAIN_SHEET, { type: 'op_rewards_position' });
  };
  const getPressHandlerForType = (type: RewardStatsActionType) => {
    switch (type) {
      case RewardStatsActionType.Bridge:
        return () =>
          navigate(Routes.EXPLAIN_SHEET, { type: 'op_rewards_bridge' });
      case RewardStatsActionType.Swap:
        return () =>
          navigate(Routes.EXPLAIN_SHEET, { type: 'op_rewards_swap' });
      default:
        return () => {};
    }
  };
  return (
    <Box paddingBottom="12px">
      <Stack space="8px">
        <Text size="20pt" color="label" weight="heavy">
          {i18n.t(i18n.l.rewards.my_stats)}
        </Text>
        <Bleed horizontal="20px">
          <ScrollView
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 8,
              paddingHorizontal: 20,
              paddingBottom: 24,
            }}
            horizontal
          >
            <Inline space="12px">
              <RewardsStatsCard
                key="Position"
                title={i18n.t(i18n.l.rewards.position)}
                value={`#${position}`}
                secondaryValue={positionChange.toString()}
                secondaryValueColor={positionChange > 0 ? 'green' : 'red'}
                secondaryValueIcon={positionChange > 0 ? '􀑁' : '􁘳'}
                onPress={navigateToPositionExplainer}
              />
              {actions.map(action => (
                <RewardsStatsCard
                  key={action.type}
                  title={capitalize(action.type)}
                  value={action.amount.usd.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })}
                  secondaryValue={i18n.t(i18n.l.rewards.percent, {
                    percent: action.rewardPercent,
                  })}
                  secondaryValueIcon="􀐚"
                  secondaryValueColor={{
                    custom: color,
                  }}
                  onPress={getPressHandlerForType(action.type)}
                />
              ))}
            </Inline>
          </ScrollView>
        </Bleed>
      </Stack>
    </Box>
  );
};
