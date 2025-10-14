import { Fragment, memo, useState } from 'react';
import { PerpMarket } from '@/features/perps/types';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { useHlTradesStore } from '@/features/perps/stores/hlTradesStore';
import { Box, Separator, Text, TextShadow } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import * as i18n from '@/languages';
import { TradeListItem } from '../../components/TradeListItem';

const DEFAULT_VISIBLE_TRADE_COUNT = 10;

export const HistorySection = memo(function HistorySection({ market }: { market: PerpMarket }) {
  const { accentColors } = usePerpsAccentColorContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const historyData = useHlTradesStore(state => state.getTradesBySymbol());

  const trades = historyData?.[market.symbol];

  if (!trades?.length) {
    return (
      <Box alignItems="center" justifyContent="center" paddingVertical="28px">
        <Text color="labelQuaternary" size="17pt" weight="heavy">
          {i18n.t(i18n.l.perps.history.no_trades)}
        </Text>
      </Box>
    );
  }

  const visibleTrades = isExpanded ? trades : trades.slice(0, DEFAULT_VISIBLE_TRADE_COUNT);

  return (
    <Box gap={16}>
      {(isExpanded || trades.length > 0) && (
        <Box gap={12}>
          <Box>
            {visibleTrades.map((trade, index) => (
              <Fragment key={trade.id}>
                <Box marginTop={{ custom: index === 0 ? -6 : 0 }}>
                  <TradeListItem trade={trade} />
                </Box>
                {index < visibleTrades.length - 1 && <Separator color={'separatorTertiary'} direction="horizontal" thickness={4 / 3} />}
              </Fragment>
            ))}
          </Box>

          {trades.length > DEFAULT_VISIBLE_TRADE_COUNT && !isExpanded && (
            <ButtonPressAnimation onPress={() => setIsExpanded(true)} scaleTo={0.98}>
              <Box
                backgroundColor={accentColors.opacity3}
                borderRadius={18}
                borderWidth={4 / 3}
                borderColor={{ custom: accentColors.opacity6 }}
                padding="12px"
                alignItems="center"
              >
                <TextShadow blur={12} shadowOpacity={0.24}>
                  <Text size="17pt" weight="bold" color={{ custom: accentColors.opacity100 }}>
                    {i18n.t(i18n.l.perps.common.more)}
                  </Text>
                </TextShadow>
              </Box>
            </ButtonPressAnimation>
          )}
        </Box>
      )}
    </Box>
  );
});
