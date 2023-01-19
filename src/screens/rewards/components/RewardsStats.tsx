import React from 'react';
import { Bleed, Box, Inline, Stack, Text } from '@/design-system';
import * as i18n from '@/languages';
import { ScrollView } from 'react-native';
import { RewardsStatsCard } from './RewardsStatsCard';
import { OpRewardsAction } from '../types/RewardsResponseType';
import { capitalize } from 'lodash';
import { useTheme } from '@/theme';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';

type Props = {
  position: number;
  positionChange: number;
  actions: OpRewardsAction[];
};

export const RewardsStats: React.FC<Props> = ({
  actions,
  position,
  positionChange,
}) => {
  const { colors } = useTheme();

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
              />
              {actions.map(action => (
                <RewardsStatsCard
                  key={action.type}
                  title={capitalize(action.type)}
                  value={convertAmountToNativeDisplay(action.amount.usd, 'USD')}
                  secondaryValue={`${action.reward_percent}% reward`}
                  secondaryValueIcon="􀐚"
                  secondaryValueColor={{
                    custom: colors.networkColors.optimism,
                  }}
                />
              ))}
            </Inline>
          </ScrollView>
        </Bleed>
      </Stack>
    </Box>
  );
};
