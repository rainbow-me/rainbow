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
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToNativeDisplay,
} from '@/helpers/utilities';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { analyticsV2 } from '@/analytics';
import { TextColor } from '@/design-system/color/palettes';
import { CustomColor } from '@/design-system/color/useForegroundColor';
import { STATS_TITLES } from '@/screens/rewards/constants';

const getPositionChangeSymbol = (positionChange: number) => {
  if (positionChange > 0) {
    return '􀑁';
  }
  if (positionChange < 0) {
    return '􁘳';
  }
  return '􁘶';
};

const getPositionChangeColor = (
  positionChange: number,
  colors: {
    up: TextColor | CustomColor;
    down: TextColor | CustomColor;
    noChange: TextColor | CustomColor;
  }
): TextColor | CustomColor => {
  if (positionChange > 0) {
    return colors.up;
  }
  if (positionChange < 0) {
    return colors.down;
  }
  return colors.noChange;
};

type Props = {
  assetPrice?: number;
  position: number;
  positionChange: number;
  actions: RewardStatsAction[];
  color: string;
};

export const RewardsStats: React.FC<Props> = ({
  assetPrice,
  actions,
  position,
  positionChange,
  color,
}) => {
  const { navigate } = useNavigation();
  const nativeCurrency = useSelector(
    (state: AppState) => state.settings.nativeCurrency
  );
  const navigateToPositionExplainer = () => {
    analyticsV2.track(analyticsV2.event.rewardsPressedPositionCard, {
      position,
    });
    navigate(Routes.EXPLAIN_SHEET, { type: 'op_rewards_position' });
  };
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
                secondaryValue={Math.abs(positionChange).toString()}
                secondaryValueColor={getPositionChangeColor(positionChange, {
                  up: 'green',
                  down: { custom: color },
                  noChange: 'labelQuaternary',
                })}
                secondaryValueIcon={getPositionChangeSymbol(positionChange)}
                onPress={navigateToPositionExplainer}
              />
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
            </Inline>
          </ScrollView>
        </Bleed>
      </Stack>
    </Box>
  );
};
