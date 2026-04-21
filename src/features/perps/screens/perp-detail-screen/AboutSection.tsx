import React, { memo, useCallback, useMemo } from 'react';

import { Box, Text, TextIcon, useColorMode } from '@/design-system';
import { HYPERLIQUID_COLORS, PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';
import { usePerpAnnotationsStore } from '@/features/perps/stores/perpAnnotationsStore';
import { type PerpMarket } from '@/features/perps/types';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { ExpandableDescriptionCard } from '@/framework/ui/components/ExpandableDescriptionCard';
import { opacity } from '@/framework/ui/utils/opacity';
import { multiply } from '@/helpers/utilities';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import { getSolidColorEquivalent } from '@/worklets/colors';

const ROW_BG = opacity(HYPERLIQUID_COLORS.green, 0.03);
const ROW_BORDER = opacity(HYPERLIQUID_COLORS.green, 0.02);

const BOX_BG_DARK = getSolidColorEquivalent({ background: PERPS_BACKGROUND_DARK, foreground: HYPERLIQUID_COLORS.green, opacity: 0.03 });
const BOX_BG_LIGHT = getSolidColorEquivalent({ background: PERPS_BACKGROUND_LIGHT, foreground: HYPERLIQUID_COLORS.green, opacity: 0.03 });

type StatRowProps = {
  icon: string;
  label: string;
  highlighted?: boolean;
  children: React.ReactNode;
};

const StatRow = memo(function StatRow({ icon, label, highlighted, children }: StatRowProps) {
  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingLeft="10px"
      paddingRight="12px"
      height={{ custom: 36 }}
      borderRadius={14}
      borderWidth={THICK_BORDER_WIDTH}
      borderColor={{ custom: highlighted ? ROW_BORDER : 'transparent' }}
      style={highlighted ? { backgroundColor: ROW_BG } : undefined}
    >
      <Box flexDirection="row" alignItems="center" gap={12}>
        <TextIcon color="labelSecondary" height={10} size="icon 15px" width={20} weight="medium">
          {icon}
        </TextIcon>
        <Text color="labelSecondary" size="17pt" weight="semibold">
          {label}
        </Text>
      </Box>
      {children}
    </Box>
  );
});

type DescriptionBoxProps = {
  description: string;
};

const DescriptionBox = memo(function DescriptionBox({ description }: DescriptionBoxProps) {
  const { isDarkMode } = useColorMode();
  const boxBg = isDarkMode ? BOX_BG_DARK : BOX_BG_LIGHT;

  const onReadMore = useCallback(() => {
    Navigation.handleAction(Routes.PERPS_ABOUT_SHEET);
  }, []);

  return (
    <ExpandableDescriptionCard
      backgroundColor={boxBg}
      borderColor={ROW_BORDER}
      borderWidth={THICK_BORDER_WIDTH}
      ctaColor={{ custom: HYPERLIQUID_COLORS.green }}
      ctaIcon="􀯻"
      ctaLabel={i18n.t(i18n.l.perps.about.read_more)}
      description={description}
      onPress={onReadMore}
      scaleTo={0.97}
    />
  );
});

export const AboutSection = memo(function AboutSection({ market }: { market: PerpMarket }) {
  const description = usePerpAnnotationsStore(state => state.getAnnotation()?.description);
  const volume = useMemo(() => formatCurrency(market.volume['24h'], { useCompactNotation: true, decimals: 2 }), [market.volume]);
  const openInterest = useMemo(
    () => formatCurrency(multiply(market.openInterest, market.price), { useCompactNotation: true, decimals: 2 }),
    [market.openInterest, market.price]
  );
  const funding = useMemo(() => `${multiply(market.fundingRate, 100)}%`, [market.fundingRate]);

  return (
    <Box gap={16}>
      {description && <DescriptionBox description={description} />}
      <Box gap={4}>
        <StatRow icon="􀣉" label={i18n.t(i18n.l.perps.about.volume_24h)} highlighted>
          <Text color="label" size="17pt" weight="medium">
            {volume}
          </Text>
        </StatRow>
        <StatRow icon="􀘾" label={i18n.t(i18n.l.perps.about.open_interest)}>
          <Text color="label" size="17pt" weight="medium">
            {openInterest}
          </Text>
        </StatRow>
        <StatRow icon="􀓞" label={i18n.t(i18n.l.perps.about.funding)} highlighted>
          <Text color="label" size="17pt" weight="medium">
            {funding}
          </Text>
        </StatRow>
      </Box>
    </Box>
  );
});
