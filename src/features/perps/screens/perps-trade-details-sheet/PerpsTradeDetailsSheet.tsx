import React, { memo, useCallback, useState } from 'react';
import * as i18n from '@/languages';
import { Box, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { PerpsAccentColorContextProvider } from '@/features/perps/context/PerpsAccentColorContext';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { RouteProp, useRoute } from '@react-navigation/native';
import Routes from '@/navigation/routesNames';
import { RootStackParamList } from '@/navigation/types';
import { HlTrade, TradeExecutionType } from '@/features/perps/types';
import { TradeDetailsGraphic } from '@/features/perps/screens/perps-trade-details-sheet/TradeDetailsGraphic';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { Image } from 'react-native';
import rainbowPlainImage from '@/assets/rainbows/plain.png';
import rainbowOgImage from '@/assets/appIconOg.png';
import { format } from 'date-fns';
import { ButtonPressAnimation } from '@/components/animations';

export const PerpsTradeDetailsSheet = memo(function PerpsTradeDetailsSheet() {
  const {
    params: { trade },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.PERPS_TRADE_DETAILS_SHEET>>();
  const separatorSecondaryColor = useForegroundColor('separatorSecondary');

  return (
    <PerpsAccentColorContextProvider>
      <PanelSheet innerBorderWidth={1} innerBorderColor={separatorSecondaryColor}>
        <PerpsTradeDetailsSheetContent trade={trade} />
      </PanelSheet>
    </PerpsAccentColorContextProvider>
  );
});

function PerpsTradeDetailsSheetContent({ trade }: { trade: HlTrade }) {
  const { isDarkMode } = useColorMode();

  return (
    <Box paddingBottom={'20px'} alignItems="center">
      <Box position="absolute" top={{ custom: 32 }} left={{ custom: 32 }}>
        {isDarkMode && (
          <Box
            backgroundColor={opacityWorklet('#677483', 0.11)}
            borderWidth={THICKER_BORDER_WIDTH}
            borderColor={{ custom: opacityWorklet('#9CA4AD', 0.05) }}
            borderRadius={12}
            width={40}
            height={40}
            alignItems="center"
            justifyContent="center"
          >
            <Image source={rainbowPlainImage} style={{ width: 22, height: 22, resizeMode: 'contain' }} />
          </Box>
        )}
        {!isDarkMode && <Image source={rainbowOgImage} style={{ width: 40, height: 40, resizeMode: 'contain' }} />}
      </Box>
      <TradeDetailsGraphic trade={trade} />
      <Box width="full" paddingHorizontal="24px" paddingTop={'8px'}>
        <TradeDetailsSection trade={trade} />
      </Box>
    </Box>
  );
}

const TradeDetailsSection = memo(function TradeDetailsSection({ trade }: { trade: HlTrade }) {
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
            <Text size="17pt" weight="semibold" color="label">
              {trade.symbol}
            </Text>
          </Box>
        }
      />
      {isOpen ? (
        <TradeDetailsRow
          icon="􀋉"
          title={i18n.t(i18n.l.perps.trade_details_sheet.entry_price)}
          rightComponent={
            <Text size="17pt" weight="semibold" color="label">
              {formatPerpAssetPrice(trade.price)}
            </Text>
          }
        />
      ) : (
        trade.entryPrice && (
          <TradeDetailsRow
            icon="􀋉"
            title={i18n.t(i18n.l.perps.trade_details_sheet.entry_price)}
            rightComponent={
              <Text size="17pt" weight="semibold" color="label">
                {formatPerpAssetPrice(trade.entryPrice)}
              </Text>
            }
          />
        )
      )}
      {!isOpen && (
        <TradeDetailsRow
          icon="􁙌"
          highlighted
          title={i18n.t(i18n.l.perps.trade_details_sheet.close_price)}
          rightComponent={
            <Text size="17pt" weight="semibold" color="label">
              {formatPerpAssetPrice(trade.price)}
            </Text>
          }
        />
      )}
      {!isOpen && <PnlTradeDetailsRow trade={trade} />}
      <TradeDetailsRow
        icon="􀐫"
        highlighted
        title={i18n.t(i18n.l.perps.trade_details_sheet.date)}
        rightComponent={
          <Text size="17pt" weight="semibold" color="label">
            {format(trade.executedAt, 'MMM d, h:mm aaa')}
          </Text>
        }
      />
    </Box>
  );
});

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
              <Text size="17pt" weight="semibold" color="label">
                {formatCurrency(trade.netPnl)}
              </Text>
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

const ROW_FILL_COLOR = opacityWorklet('#09111F', 0.025);
const ROW_BORDER_COLOR = opacityWorklet('#09111F', 0.01);
const ROW_FILL_COLOR_DARK = opacityWorklet('#677483', 0.03);
const ROW_BORDER_COLOR_DARK = opacityWorklet('#9CA4AD', 0.02);

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
