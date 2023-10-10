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

const getPositionChangeSymbol = (positionChange: number) => {
  if (positionChange > 0) {
    return '􀑁';
  }
  if (positionChange < 0) {
    return '􁘳';
  }
  return '􀐚';
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
  position = 0,
  positionChange = 0,
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
            <RewardsStatsCard
              key="Swapped"
              title={i18n.t(i18n.l.rewards.swapped)}
              value={`$${position}`}
              secondaryValue={`${Math.abs(positionChange).toString()}% reward`}
              secondaryValueColor={getPositionChangeColor(positionChange, {
                up: { custom: color },
                down: { custom: color },
                noChange: { custom: color },
              })}
              secondaryValueIcon={getPositionChangeSymbol(positionChange)}
              onPress={navigateToPositionExplainer}
            />
          </Box>

          <Box flexGrow={1}>
            <RewardsStatsCard
              key="Bridged"
              title={i18n.t(i18n.l.rewards.bridged)}
              value={`$${position}`}
              secondaryValue={`${Math.abs(positionChange).toString()}% reward`}
              secondaryValueColor={getPositionChangeColor(positionChange, {
                up: { custom: color },
                down: { custom: color },
                noChange: { custom: color },
              })}
              secondaryValueIcon={getPositionChangeSymbol(positionChange)}
              onPress={navigateToPositionExplainer}
            />
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};
