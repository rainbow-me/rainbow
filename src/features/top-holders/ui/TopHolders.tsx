import React, { memo, useState } from 'react';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Box, Separator, Text, TextShadow, useForegroundColor } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import { useCurrencyConversionStore } from '@/features/currency/stores/currencyConversionStore';
import type { NativeCurrencyKey } from '@/features/currency/types';
import useENSAvatar from '@/features/ens/hooks/useENSAvatar';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { formatNativeAmount, formatPnlAmount, formatPnlPercentage, PnlArrow, pnlColor } from '@/features/spot-pnl/ui/pnlDisplay';
import { lessThanWorklet, mulWorklet, toFixedWorklet } from '@/framework/core/safeMath';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { AddressAvatar } from '@/screens/change-wallet/components/AddressAvatar';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useTheme } from '@/theme/ThemeContext';
import { address as abbreviateAddress, abbreviateEnsForDisplay } from '@/utils/abbreviations';
import { addressHashedColorIndex } from '@/utils/profileUtils';

import { type ProfitHolderRow, type StakeHolderRow, type TokenHolder } from '../core/topHolders';
import { useTopHolderNamesStore } from '../data/topHolderNamesStore';
import { useTopHoldersStore } from '../data/topHoldersStore';

type Tab = 'stake' | 'profit';

export const HOLDER_ROW_HEIGHT = 58;
export const HOLDER_ROW_SEPARATOR_HEIGHT = 1;
export const TAB_TOGGLE_HEIGHT = 36;
export const TAB_TOGGLE_GAP = 8;
const AVATAR_SIZE = 32;
const RANK_WIDTH = 40;

/** The Top Holders lists for the viewed token. Renders nothing until there is a holder to show. */
export const TopHolders = memo(function TopHolders({ token }: { token: { address: string; chainId: ChainId } }) {
  const [selectedTab, setSelectedTab] = useState<Tab>('stake');
  const hasProfitHolders = useTopHoldersStore(state => !!state.getData()?.byProfit.length);
  const tab = hasProfitHolders ? selectedTab : 'stake';

  return (
    <Box gap={TAB_TOGGLE_GAP}>
      {hasProfitHolders && <TabToggle selectedTab={tab} onSelect={setSelectedTab} />}
      <HolderList tab={tab} token={token} />
    </Box>
  );
});

function TabToggle({ selectedTab, onSelect }: { selectedTab: Tab; onSelect: (tab: Tab) => void }) {
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
      <TabButton
        label={i18n.t(i18n.l.expanded_state.sections.top_holders.by_stake)}
        tab="stake"
        selectedTab={selectedTab}
        onSelect={onSelect}
      />
      <TabButton
        label={i18n.t(i18n.l.expanded_state.sections.top_holders.by_profit)}
        tab="profit"
        selectedTab={selectedTab}
        onSelect={onSelect}
      />
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
              <Text align="center" color="accent" size="17pt" weight="heavy">
                {label}
              </Text>
            </TextShadow>
          ) : (
            <Text align="center" color="labelSecondary" size="17pt" weight="heavy">
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
    tab === 'stake'
      ? topHolders.byStake.map((row, index) => (
          <StakeRow
            key={row.holder.address}
            nativeCurrency={nativeCurrency}
            rank={index + 1}
            row={row}
            token={token}
            usdToNativeRate={usdToNativeRate}
          />
        ))
      : topHolders.byProfit.map((row, index) => (
          <ProfitRow
            key={row.holder.address}
            nativeCurrency={nativeCurrency}
            rank={index + 1}
            row={row}
            token={token}
            usdToNativeRate={usdToNativeRate}
          />
        ));

  return (
    <Box>
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

const StakeRow = memo(function StakeRow({ nativeCurrency, rank, row, token, usdToNativeRate }: RowProps<StakeHolderRow>) {
  const supply = lessThanWorklet(row.supplyPercentage, 0.01) ? '<0.01%' : `${toFixedWorklet(row.supplyPercentage, 2)}%`;

  return (
    <HolderRow
      holder={row.holder}
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
        {formatNativeAmount(mulWorklet(row.valueUsd, usdToNativeRate), nativeCurrency, { compact: true })}
      </Text>
    </HolderRow>
  );
});

const ProfitRow = memo(function ProfitRow({ nativeCurrency, rank, row, token, usdToNativeRate }: RowProps<ProfitHolderRow>) {
  const { colors } = useTheme();
  const { direction } = formatPnlAmount(mulWorklet(row.pnl.amount, usdToNativeRate), nativeCurrency);
  const color = pnlColor(direction, colors);

  return (
    <HolderRow holder={row.holder} rank={rank} token={token}>
      <Box alignItems="flex-end" gap={10}>
        <Text color="label" size="17pt" weight="semibold">
          {formatNativeAmount(mulWorklet(row.valueUsd, usdToNativeRate), nativeCurrency, { compact: true })}
        </Text>
        <Box flexDirection="row" alignItems="center" gap={2}>
          <PnlArrow color={color} direction={direction} size="10pt" weight="heavy" />
          <Text color={color} size="15pt" weight="bold">
            {formatPnlPercentage(row.pnl.percentage, { compact: true })}
          </Text>
        </Box>
      </Box>
    </HolderRow>
  );
});

function HolderRow({
  children,
  holder,
  rank,
  subtitle,
  token,
}: {
  children: React.ReactNode;
  holder: TokenHolder;
  rank: number;
  subtitle?: React.ReactNode;
  token: { address: string; chainId: ChainId };
}) {
  const ensName = useTopHolderNamesStore(state => state.getData()?.[holder.address.toLowerCase()] ?? null);

  const openPnlSheet = () =>
    Navigation.handleAction(Routes.SPOT_PNL_SHEET, {
      address: token.address,
      chainId: token.chainId,
      walletAddress: holder.address,
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
          <HolderAvatar address={holder.address} ensName={ensName} />
          <Box flexShrink={1} gap={10}>
            <Text color="label" size="17pt" weight="semibold" numberOfLines={1}>
              {abbreviateEnsForDisplay(ensName ?? undefined) ?? abbreviateAddress(holder.address, 4, 6)}
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
