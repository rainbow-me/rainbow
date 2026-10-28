import React, { memo, useState } from 'react';

import { shallowEqual } from '@storesjs/stores';
import Animated from 'react-native-reanimated';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { LAYOUT_ANIMATION } from '@/components/collapsible/CollapsibleSectionBase';
import { Box, Separator, Text, TextShadow, useForegroundColor } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import { useCurrencyConversionStore } from '@/features/currency/stores/currencyConversionStore';
import type { NativeCurrencyKey } from '@/features/currency/types';
import useENSAvatar from '@/features/ens/hooks/useENSAvatar';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { PnlArrow, pnlColor } from '@/features/spot-pnl/ui/pnlDisplay';
import { formatNativeAmount, formatPnlAmount, formatPnlPercentage, pnlSign } from '@/features/spot-pnl/ui/pnlFormat';
import { lessThanWorklet, mulWorklet, toFixedWorklet } from '@/framework/core/safeMath';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { AddressAvatar } from '@/screens/change-wallet/components/AddressAvatar';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useTheme } from '@/theme/ThemeContext';
import { address as abbreviateAddress, abbreviateEnsForDisplay } from '@/utils/abbreviations';
import { addressHashedColorIndex } from '@/utils/profileUtils';

import { type HoldingRow, type RealizedRow, type UnrealizedRow } from '../core/topHolders';
import { useTopHolderNamesStore } from '../data/topHolderNamesStore';
import { useTopHoldersStore } from '../data/topHoldersStore';

const TABS = ['holding', 'unrealized', 'realized'] as const;
type Tab = (typeof TABS)[number];

export const HOLDER_ROW_HEIGHT = 58;
export const HOLDER_ROW_SEPARATOR_HEIGHT = 1;
export const TAB_TOGGLE_HEIGHT = 36;
export const TAB_TOGGLE_GAP = 8;
const AVATAR_SIZE = 32;
const RANK_WIDTH = 40;

/** The Top Holders lists for the viewed token, one tab per list that has a row. Renders nothing until there is a row to show. */
export const TopHolders = memo(function TopHolders({ token }: { token: { address: string; chainId: ChainId } }) {
  const [selectedTab, setSelectedTab] = useState<Tab>('holding');
  const tabs = useTopHoldersStore(state => {
    const topHolders = state.getData();
    return topHolders ? TABS.filter(tab => topHolders[tab].length) : [];
  }, shallowEqual);
  const tab = tabs.includes(selectedTab) ? selectedTab : tabs[0];
  if (!tab) return null;

  return (
    <Box gap={TAB_TOGGLE_GAP}>
      {tabs.length > 1 && <TabToggle selectedTab={tab} tabs={tabs} onSelect={setSelectedTab} />}
      <HolderList tab={tab} token={token} />
    </Box>
  );
});

function TabToggle({ onSelect, selectedTab, tabs }: { onSelect: (tab: Tab) => void; selectedTab: Tab; tabs: Tab[] }) {
  const accent = useForegroundColor('accent');

  return (
    <Box
      borderColor={{ custom: opacity(accent, 0.1) }}
      borderRadius={22}
      borderWidth={4 / 3}
      flexDirection="row"
      gap={3}
      height={{ custom: TAB_TOGGLE_HEIGHT }}
      padding={{ custom: 3 }}
    >
      {tabs.map(tab => (
        <TabButton
          key={tab}
          label={i18n.t(i18n.l.expanded_state.sections.top_holders[tab])}
          tab={tab}
          selectedTab={selectedTab}
          onSelect={onSelect}
        />
      ))}
    </Box>
  );
}

function TabButton({ label, onSelect, selectedTab, tab }: { label: string; onSelect: (tab: Tab) => void; selectedTab: Tab; tab: Tab }) {
  const accent = useForegroundColor('accent');
  const isSelected = selectedTab === tab;

  return (
    <Box flexGrow={1} flexBasis={0}>
      <ButtonPressAnimation disabled={isSelected} onPress={() => onSelect(tab)} scaleTo={0.96}>
        <Box
          alignItems="center"
          backgroundColor={isSelected ? opacity(accent, 0.12) : undefined}
          borderColor={isSelected ? { custom: opacity(accent, 0.06) } : undefined}
          borderRadius={17}
          borderWidth={isSelected ? 4 / 3 : undefined}
          height="full"
          justifyContent="center"
        >
          {isSelected ? (
            <TextShadow blur={12} shadowOpacity={0.24}>
              <Text align="center" color="accent" numberOfLines={1} size="17pt" weight="heavy">
                {label}
              </Text>
            </TextShadow>
          ) : (
            <Text align="center" color="labelSecondary" numberOfLines={1} size="17pt" weight="heavy">
              {label}
            </Text>
          )}
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
}

function HolderList({ tab, token }: { tab: Tab; token: { address: string; chainId: ChainId } }) {
  const topHolders = useTopHoldersStore(state => state.getData());
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const usdToNativeRate = useCurrencyConversionStore(state => state.getConversionRate());
  if (!topHolders) return null;

  const rows =
    tab === 'holding'
      ? topHolders.holding.map((row, index) => (
          <HoldingHolderRow
            key={row.address}
            nativeCurrency={nativeCurrency}
            rank={index + 1}
            row={row}
            token={token}
            usdToNativeRate={usdToNativeRate}
          />
        ))
      : tab === 'unrealized'
        ? topHolders.unrealized.map((row, index) => (
            <UnrealizedHolderRow
              key={row.address}
              nativeCurrency={nativeCurrency}
              rank={index + 1}
              row={row}
              token={token}
              usdToNativeRate={usdToNativeRate}
            />
          ))
        : topHolders.realized.map((row, index) => (
            <RealizedHolderRow
              key={row.address}
              nativeCurrency={nativeCurrency}
              rank={index + 1}
              row={row}
              token={token}
              usdToNativeRate={usdToNativeRate}
            />
          ));

  return (
    // Clipped so a longer list is revealed as the height grows instead of overlapping the sections below
    <Box as={Animated.View} layout={LAYOUT_ANIMATION} style={{ overflow: 'hidden' }}>
      {rows.map((row, index) => (
        <React.Fragment key={row.key}>
          {index > 0 && <RowSeparator />}
          {row}
        </React.Fragment>
      ))}
    </Box>
  );
}

type RowProps<T> = {
  nativeCurrency: NativeCurrencyKey;
  rank: number;
  row: T;
  token: { address: string; chainId: ChainId };
  usdToNativeRate: number;
};

const HoldingHolderRow = memo(function HoldingHolderRow({ nativeCurrency, rank, row, token, usdToNativeRate }: RowProps<HoldingRow>) {
  const supply = lessThanWorklet(row.supplyPercentage, 0.01) ? '<0.01%' : `${toFixedWorklet(row.supplyPercentage, 2)}%`;

  return (
    <HolderRow
      address={row.address}
      rank={rank}
      subtitle={
        <Box flexDirection="row" gap={3}>
          <Text color="labelQuaternary" size="13pt" weight="semibold">
            {supply}
          </Text>
          <Text color="labelQuinary" size="13pt" weight="semibold" numberOfLines={1}>
            {i18n.t(i18n.l.expanded_state.sections.top_holders.of_supply)}
          </Text>
        </Box>
      }
      token={token}
    >
      <Text color="label" size="17pt" weight="semibold">
        {formatNativeAmount(mulWorklet(row.valueUsd, usdToNativeRate), nativeCurrency)}
      </Text>
    </HolderRow>
  );
});

const UnrealizedHolderRow = memo(function UnrealizedHolderRow({
  nativeCurrency,
  rank,
  row,
  token,
  usdToNativeRate,
}: RowProps<UnrealizedRow>) {
  return (
    <HolderRow
      address={row.address}
      rank={rank}
      subtitle={
        <Box flexDirection="row" gap={3}>
          <Text color="labelQuinary" size="13pt" weight="semibold">
            {i18n.t(i18n.l.spot_pnl_sheet.avg_entry)}
          </Text>
          <Text color="labelQuaternary" size="13pt" weight="semibold" numberOfLines={1}>
            {formatAssetPrice({ value: mulWorklet(row.avgEntryUsd, usdToNativeRate), currency: nativeCurrency })}
          </Text>
        </Box>
      }
      token={token}
    >
      <PnlFigures
        amountUsd={row.pnl.amount}
        nativeCurrency={nativeCurrency}
        percentage={row.pnl.percentage}
        usdToNativeRate={usdToNativeRate}
      />
    </HolderRow>
  );
});

const RealizedHolderRow = memo(function RealizedHolderRow({ nativeCurrency, rank, row, token, usdToNativeRate }: RowProps<RealizedRow>) {
  return (
    <HolderRow address={row.address} rank={rank} token={token}>
      <PnlFigures
        amountUsd={row.realized.amount}
        nativeCurrency={nativeCurrency}
        percentage={row.realized.percentage}
        usdToNativeRate={usdToNativeRate}
      />
    </HolderRow>
  );
});

/** A signed P&L amount over its percentage, coloured by direction. */
function PnlFigures({
  amountUsd,
  nativeCurrency,
  percentage,
  usdToNativeRate,
}: {
  amountUsd: string;
  nativeCurrency: NativeCurrencyKey;
  percentage: string | null;
  usdToNativeRate: number;
}) {
  const { colors } = useTheme();
  const { direction, display } = formatPnlAmount(mulWorklet(amountUsd, usdToNativeRate), nativeCurrency);
  const color = pnlColor(direction, colors);

  return (
    <Box alignItems="flex-end" gap={10}>
      <Text color="label" size="17pt" weight="semibold">
        {`${pnlSign(direction)}${display}`}
      </Text>
      {percentage !== null && (
        <Box flexDirection="row" alignItems="center" gap={2}>
          <PnlArrow color={color} direction={direction} size="10pt" weight="heavy" />
          <Text color={color} size="15pt" weight="bold">
            {formatPnlPercentage(percentage)}
          </Text>
        </Box>
      )}
    </Box>
  );
}

function HolderRow({
  address,
  children,
  rank,
  subtitle,
  token,
}: {
  address: string;
  children: React.ReactNode;
  rank: number;
  subtitle?: React.ReactNode;
  token: { address: string; chainId: ChainId };
}) {
  const ensName = useTopHolderNamesStore(state => state.getData()?.[address.toLowerCase()] ?? null);

  const openPnlSheet = () =>
    Navigation.handleAction(Routes.SPOT_PNL_SHEET, {
      address: token.address,
      chainId: token.chainId,
      walletAddress: address,
      ensName: ensName ?? undefined,
    });

  return (
    <ButtonPressAnimation onPress={openPnlSheet} scaleTo={0.98}>
      <Box flexDirection="row" alignItems="center" height={{ custom: HOLDER_ROW_HEIGHT }}>
        <Box width={{ custom: RANK_WIDTH }}>
          <TextShadow blur={12} shadowOpacity={0.24}>
            <Text color="accent" size="22pt" weight="semibold">
              {String(rank)}
            </Text>
          </TextShadow>
        </Box>
        <Box flexDirection="row" alignItems="center" flexGrow={1} flexShrink={1} gap={12}>
          <HolderAvatar address={address} ensName={ensName} />
          <Box flexShrink={1} gap={10}>
            <Text color="label" size="17pt" weight="semibold" numberOfLines={1}>
              {abbreviateEnsForDisplay(ensName ?? undefined) ?? abbreviateAddress(address, 4, 6)}
            </Text>
            {subtitle}
          </Box>
        </Box>
        <Box alignItems="flex-end" paddingLeft="12px">
          {children}
        </Box>
      </Box>
    </ButtonPressAnimation>
  );
}

function HolderAvatar({ address, ensName }: { address: string; ensName: string | null }) {
  const { data: avatar } = useENSAvatar(ensName ?? '', { enabled: !!ensName });
  return (
    <AddressAvatar address={address} color={addressHashedColorIndex(address) ?? 0} label="" size={AVATAR_SIZE} url={avatar?.imageUrl} />
  );
}

function RowSeparator() {
  return (
    <Box paddingLeft={{ custom: RANK_WIDTH }}>
      <Separator color="separatorTertiary" thickness={HOLDER_ROW_SEPARATOR_HEIGHT} />
    </Box>
  );
}
