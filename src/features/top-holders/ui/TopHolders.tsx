import React, { memo, useState } from 'react';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { ImgixImage } from '@/components/images';
import { Box, Separator, Text, TextShadow, useForegroundColor } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import type { NativeCurrencyKey } from '@/features/currency/types';
import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import useENSAvatar from '@/features/ens/hooks/useENSAvatar';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { formatPnlAmount, formatPnlPercentage, PnlArrow, pnlColor } from '@/features/spot-pnl/ui/pnlDisplay';
import { lessThanWorklet, toFixedWorklet } from '@/framework/core/safeMath';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useTheme } from '@/theme/ThemeContext';
import { address as abbreviateAddress, abbreviateEnsForDisplay } from '@/utils/abbreviations';
import { addressHashedColorIndex, addressHashedEmoji } from '@/utils/profileUtils';

import { type ProfitHolderRow, type StakeHolderRow, type TokenHolder } from '../core/topHolders';
import { useTopHolderNamesStore, useTopHoldersStore } from '../data/topHoldersStore';

type Tab = 'stake' | 'profit';

const ROW_HEIGHT = 58;
const AVATAR_SIZE = 32;
const RANK_WIDTH = 40;

/** The Top Holders lists for the viewed token. Renders nothing until there is a holder to show. */
export const TopHolders = memo(function TopHolders({ token }: { token: { address: string; chainId: ChainId } }) {
  const [selectedTab, setSelectedTab] = useState<Tab>('stake');
  const hasProfitHolders = useTopHoldersStore(topHolders => !!topHolders?.byProfit.length);
  const tab = hasProfitHolders ? selectedTab : 'stake';

  return (
    <Box gap={8}>
      {hasProfitHolders && <TabToggle selectedTab={tab} onSelect={setSelectedTab} />}
      {tab === 'stake' ? <StakeList token={token} /> : <ProfitList token={token} />}
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
      height={{ custom: 36 }}
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

function StakeList({ token }: { token: { address: string; chainId: ChainId } }) {
  const rows = useTopHoldersStore(topHolders => topHolders?.byStake);
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  if (!rows) return null;

  return (
    <Box>
      {rows.map((row, index) => (
        <React.Fragment key={row.holder.address}>
          {index > 0 && <RowSeparator />}
          <StakeRow nativeCurrency={nativeCurrency} rank={index + 1} row={row} token={token} />
        </React.Fragment>
      ))}
    </Box>
  );
}

function ProfitList({ token }: { token: { address: string; chainId: ChainId } }) {
  const rows = useTopHoldersStore(topHolders => topHolders?.byProfit);
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  if (!rows) return null;

  return (
    <Box>
      {rows.map((row, index) => (
        <React.Fragment key={row.holder.address}>
          {index > 0 && <RowSeparator />}
          <ProfitRow nativeCurrency={nativeCurrency} rank={index + 1} row={row} token={token} />
        </React.Fragment>
      ))}
    </Box>
  );
}

type RowProps<T> = { nativeCurrency: NativeCurrencyKey; rank: number; row: T; token: { address: string; chainId: ChainId } };

const StakeRow = memo(function StakeRow({ nativeCurrency, rank, row, token }: RowProps<StakeHolderRow>) {
  const supply = lessThanWorklet(row.supplyPercentage, 0.01) ? '<0.01%' : `${toFixedWorklet(row.supplyPercentage, 2)}%`;

  return (
    <HolderRow
      holder={row.holder}
      rank={rank}
      subtitle={i18n.t(i18n.l.expanded_state.sections.top_holders.of_supply, { percentage: supply })}
      token={token}
    >
      <Text color="label" size="17pt" weight="semibold" tabularNumbers>
        {convertAmountToNativeDisplay(row.value, nativeCurrency, undefined, undefined, true)}
      </Text>
    </HolderRow>
  );
});

const ProfitRow = memo(function ProfitRow({ nativeCurrency, rank, row, token }: RowProps<ProfitHolderRow>) {
  const { colors } = useTheme();
  const { direction } = formatPnlAmount(row.pnl.amount, nativeCurrency);
  const color = pnlColor(direction, colors);

  return (
    <HolderRow holder={row.holder} rank={rank} token={token}>
      <Box alignItems="flex-end" gap={10}>
        <Text color="label" size="17pt" weight="semibold" tabularNumbers>
          {convertAmountToNativeDisplay(row.value, nativeCurrency, undefined, undefined, true)}
        </Text>
        <Box flexDirection="row" alignItems="center" gap={2}>
          <PnlArrow color={color} direction={direction} size="10pt" weight="heavy" />
          <Text color={color} size="15pt" weight="bold" tabularNumbers>
            {formatPnlPercentage(row.pnl.percentage)}
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
  subtitle?: string;
  token: { address: string; chainId: ChainId };
}) {
  const ensName = useTopHolderNamesStore(state => state.getData()?.[holder.address.toLowerCase()] ?? null);

  const openPnlSheet = () =>
    Navigation.handleAction(Routes.SPOT_PNL_SHEET, {
      address: token.address,
      chainId: token.chainId,
      holder: { address: holder.address, ensName, balance: holder.balance, trades: holder.trades },
    });

  return (
    <ButtonPressAnimation onPress={openPnlSheet} scaleTo={0.98}>
      <Box flexDirection="row" alignItems="center" height={{ custom: ROW_HEIGHT }}>
        <Box width={{ custom: RANK_WIDTH }}>
          <TextShadow blur={12} shadowOpacity={0.24}>
            <Text color="accent" size="22pt" weight="semibold" tabularNumbers>
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
            {subtitle && (
              <Text color="labelTertiary" size="13pt" weight="semibold" numberOfLines={1}>
                {subtitle}
              </Text>
            )}
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
  const { colors } = useTheme();
  const { data: avatar } = useENSAvatar(ensName ?? '', { enabled: !!ensName });

  if (avatar?.imageUrl) {
    return (
      <ImgixImage
        size={AVATAR_SIZE}
        source={{ uri: avatar.imageUrl }}
        style={{ borderRadius: AVATAR_SIZE / 2, height: AVATAR_SIZE, width: AVATAR_SIZE }}
      />
    );
  }
  return (
    <Box
      alignItems="center"
      backgroundColor={colors.avatarBackgrounds[addressHashedColorIndex(address) ?? 0]}
      borderRadius={AVATAR_SIZE / 2}
      height={{ custom: AVATAR_SIZE }}
      justifyContent="center"
      width={{ custom: AVATAR_SIZE }}
    >
      <Text align="center" color="label" size="15pt" weight="bold">
        {addressHashedEmoji(address) ?? ''}
      </Text>
    </Box>
  );
}

function RowSeparator() {
  return (
    <Box paddingLeft={{ custom: RANK_WIDTH }}>
      <Separator color="separatorTertiary" thickness={1} />
    </Box>
  );
}
