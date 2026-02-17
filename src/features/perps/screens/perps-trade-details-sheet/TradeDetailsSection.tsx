import { Box, Text, TextIcon, useColorMode } from '@/design-system';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { extractBaseSymbol } from '@/features/perps/utils/hyperliquidSymbols';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { format } from 'date-fns';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { type HlTrade, TradeExecutionType } from '@/features/perps/types';
import { memo, useCallback, useState } from 'react';
import * as i18n from '@/languages';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';
import { opacity } from '@/framework/ui/utils/opacity';

export function TradeDetailsSection({ trade }: { trade: HlTrade }) {
  const isOpen = trade.executionType === TradeExecutionType.LONG_OPENED || trade.executionType === TradeExecutionType.SHORT_OPENED;

  return (
    <Box width="full" gap={4}>
      <TradeDetailsRow
        icon="􀯠"
        highlighted
        title={i18n.t(i18n.l.perps.trade_details_sheet.market)}
        rightComponent={
          <Box flexDirection="row" alignItems="center" gap={6}>
            <HyperliquidTokenIcon symbol={trade.symbol} size={18} />
            <RowValue text={extractBaseSymbol(trade.symbol)} />
          </Box>
        }
      />
      {isOpen ? (
        <TradeDetailsRow
          icon="􀋉"
          title={i18n.t(i18n.l.perps.trade_details_sheet.entry_price)}
          rightComponent={<RowValue text={formatPerpAssetPrice(trade.price)} />}
        />
      ) : (
        trade.entryPrice && (
          <TradeDetailsRow
            icon="􀋉"
            title={i18n.t(i18n.l.perps.trade_details_sheet.entry_price)}
            rightComponent={<RowValue text={formatPerpAssetPrice(trade.entryPrice)} />}
          />
        )
      )}
      {!isOpen && (
        <TradeDetailsRow
          icon="􁙌"
          highlighted
          title={i18n.t(i18n.l.perps.trade_details_sheet.close_price)}
          rightComponent={<RowValue text={formatPerpAssetPrice(trade.price)} />}
        />
      )}
      {!isOpen && <PnlTradeDetailsRow trade={trade} />}
      <TradeDetailsRow
        icon="􀐫"
        highlighted
        title={i18n.t(i18n.l.perps.trade_details_sheet.date)}
        rightComponent={<RowValue text={format(trade.executedAt, 'MMM d, h:mm aaa')} />}
      />
    </Box>
  );
}

const PnlTradeDetailsRow = memo(function NetProfitTradeDetailsRow({ trade }: { trade: HlTrade }) {
  const [hidden, setHidden] = useState(false);
  const isLoss = Number(trade.netPnl) < 0;

  const toggleHidden = useCallback(() => {
    setHidden(hidden => !hidden);
  }, []);

  return (
    <ButtonPressAnimation onPress={toggleHidden} scaleTo={0.975}>
      <TradeDetailsRow
        icon={isLoss ? '􁘳' : '􀑁'}
        title={isLoss ? i18n.t(i18n.l.perps.trade_details_sheet.loss) : i18n.t(i18n.l.perps.trade_details_sheet.profit)}
        rightComponent={
          <Box flexDirection="row" alignItems="center" gap={12}>
            {hidden ? (
              <Text size="13pt" weight="semibold" color="label" style={{ opacity: 0.3 }}>
                {'􀸓􀸓􀸓􀸓􀸓'}
              </Text>
            ) : (
              <RowValue text={formatCurrency(trade.netPnl)} />
            )}
            <TextIcon size="icon 15px" weight="bold" color="labelTertiary">
              {hidden ? '􀋯' : '􀋭'}
            </TextIcon>
          </Box>
        }
      />
    </ButtonPressAnimation>
  );
});

const RowValue = memo(function RowValue({ text }: { text: string }) {
  return (
    <Text size="17pt" weight="semibold" color="label">
      {text}
    </Text>
  );
});

const ROW_FILL_COLOR = opacity('#09111F', 0.025);
const ROW_BORDER_COLOR = opacity('#09111F', 0.01);
const ROW_FILL_COLOR_DARK = opacity('#677483', 0.03);
const ROW_BORDER_COLOR_DARK = opacity('#9CA4AD', 0.02);

const TradeDetailsRow = memo(function TradeDetailsRow({
  icon,
  title,
  rightComponent,
  highlighted,
}: {
  icon: string;
  title: string;
  rightComponent: React.ReactNode;
  highlighted?: boolean;
}) {
  const { isDarkMode } = useColorMode();
  const rowFillColor = isDarkMode ? ROW_FILL_COLOR_DARK : ROW_FILL_COLOR;
  const rowBorderColor = isDarkMode ? ROW_BORDER_COLOR_DARK : ROW_BORDER_COLOR;

  return (
    <Box
      width="full"
      height={36}
      backgroundColor={highlighted ? rowFillColor : 'transparent'}
      borderColor={{ custom: highlighted ? rowBorderColor : 'transparent' }}
      borderWidth={THICKER_BORDER_WIDTH}
      borderRadius={14}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      paddingHorizontal="10px"
    >
      <Box flexDirection="row" alignItems="center" gap={12}>
        <TextIcon size="icon 15px" weight="bold" color="labelTertiary">
          {icon}
        </TextIcon>
        <Text size="17pt" weight="medium" color="labelSecondary">
          {title}
        </Text>
      </Box>
      {rightComponent}
    </Box>
  );
});
