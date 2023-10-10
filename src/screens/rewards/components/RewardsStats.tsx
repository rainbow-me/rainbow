import React from 'react';
import { Box, Stack, Text } from '@/design-system';
import * as i18n from '@/languages';
import { RewardsStatsCard } from './RewardsStatsCard';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import {
  RewardStatsAction,
  RewardStatsActionType,
} from '@/graphql/__generated__/metadata';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToNativeDisplay,
} from '@/helpers/utilities';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { analyticsV2 } from '@/analytics';
import { STATS_TITLES } from '@/screens/rewards/constants';
import { noop } from 'lodash';

type Props = {
  assetPrice?: number;
  actions: RewardStatsAction[];
  color: string;
};

export const RewardsStats: React.FC<Props> = ({
  assetPrice,
  actions,
  color,
}) => {
  const { navigate } = useNavigation();

  const nativeCurrency = useSelector(
    (state: AppState) => state.settings.nativeCurrency
  );

  const getPressHandlerForType = (type: RewardStatsActionType) => {
    switch (type) {
      case RewardStatsActionType.Bridge:
        return () => {
          analyticsV2.track(analyticsV2.event.rewardsPressedBridgedCard);
          navigate(Routes.EXPLAIN_SHEET, { type: 'op_rewards_bridge' });
        };
      case RewardStatsActionType.Swap:
        return () => {
          analyticsV2.track(analyticsV2.event.rewardsPressedSwappedCard);
          navigate(Routes.EXPLAIN_SHEET, { type: 'op_rewards_swap' });
        };
      default:
        return noop;
    }
  };

  return (
    <Box width="full" paddingBottom="12px">
      <Stack space="16px">
        <Text size="20pt" color="label" weight="heavy">
          {i18n.t(i18n.l.rewards.my_stats)}
        </Text>

        <Box
          alignItems="flex-start"
          flexDirection="row"
          justifyContent="flex-start"
          flexGrow={1}
          style={{ gap: 12 }}
        >
          <Box flexGrow={1}>
            {actions.map(action => {
              const value =
                assetPrice !== undefined
                  ? convertAmountAndPriceToNativeDisplay(
                      action.amount.token,
                      assetPrice,
                      nativeCurrency
                    ).display
                  : convertAmountToNativeDisplay(action.amount.usd, 'USD');

              return (
                <RewardsStatsCard
                  key={action.type}
                  title={STATS_TITLES[action.type]}
                  value={value}
                  secondaryValue={i18n.t(i18n.l.rewards.percent, {
                    percent: action.rewardPercent,
                  })}
                  secondaryValueIcon="􀐚"
                  secondaryValueColor={{
                    custom: color,
                  }}
                  onPress={getPressHandlerForType(action.type)}
                />
              );
            })}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};
