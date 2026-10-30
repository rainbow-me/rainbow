import React, { memo, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator } from 'react-native';

import { LinearTransition } from 'react-native-reanimated';
import { type Address } from 'viem';

import { analytics } from '@/analytics';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { useLiveTokenValue } from '@/components/live-token-text/useLiveTokenValue';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, Separator, Text, TextShadow } from '@/design-system';
import { type TextProps } from '@/design-system/components/Text/Text';
import { getUniqueId } from '@/entities/assetId';
import { useCurrencyConversionStore } from '@/features/currency/stores/currencyConversionStore';
import type { NativeCurrencyKey } from '@/features/currency/types';
import useENSAvatar from '@/features/ens/hooks/useENSAvatar';
import type { ChainId } from '@/features/network/types/backendNetworks';
import { divWorklet, greaterThanWorklet, lessThanWorklet, mulWorklet } from '@/framework/core/safeMath';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import useAccountAsset from '@/hooks/useAccountAsset';
import useAdditionalAssetData from '@/hooks/useAdditionalAssetData';
import { useStableValue } from '@/hooks/useStableValue';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import { useRoute } from '@/navigation/RouteContext';
import Routes from '@/navigation/routesNames';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { getCodexTokenId } from '@/resources/platform/codex';
import { AddressAvatar } from '@/screens/change-wallet/components/AddressAvatar';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { type TokenData } from '@/state/liveTokens/types';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme/ThemeContext';
import { address as abbreviateAddress, abbreviateEnsForDisplay } from '@/utils/abbreviations';
import isLowerCaseMatch from '@/utils/isLowerCaseMatch';

import { calculateSpotPnl, type PnlReturn, type SpotPnl, type WalletTokenTrades } from '../core/spotPnl';
import { type UnrealizedPnl } from '../core/unrealizedPnl';
import { createTokenTradesStore, useTokenTradesStore } from '../data/tokenTradesStore';
import { PnlArrow, pnlColor } from './pnlDisplay';
import { formatCompactTokenAmount, formatNativeAmount, formatPnlAmount, formatPnlPercentage, pnlSign } from './pnlFormat';

const SHEET_BORDER_RADIUS = 38;
const CARD_BORDER_RADIUS = 22;
// Height of the unrealized-position body, so the sheet opens at its full height before trades load
const PLACEHOLDER_HEIGHT = 252;

const PANEL_LAYOUT = LinearTransition.springify()
  .mass(SPRING_CONFIGS.sheetTransition.mass)
  .damping(SPRING_CONFIGS.sheetTransition.damping)
  .stiffness(SPRING_CONFIGS.sheetTransition.stiffness);

export const SpotPnlSheet = memo(function SpotPnlSheet() {
  const {
    params: { address, chainId, ensName, trades, walletAddress: routeWalletAddress },
  } = useRoute<typeof Routes.SPOT_PNL_SHEET>();
  const selectedWalletAddress = userAssetsStoreManager(state => state.address);
  const walletAddress = routeWalletAddress ?? selectedWalletAddress;
  // Codex returns lowercased addresses, so a Top Holders row for the selected wallet differs in case
  const isSelectedWallet = !!walletAddress && isLowerCaseMatch(walletAddress, selectedWalletAddress ?? undefined);

  return (
    <PanelSheet borderRadius={SHEET_BORDER_RADIUS} innerBorderWidth={1} layoutAnimation={PANEL_LAYOUT}>
      {walletAddress && (
        <SpotPnlSheetContent
          tokenAddress={address}
          chainId={chainId}
          walletAddress={walletAddress}
          ensName={ensName}
          isSelectedWallet={isSelectedWallet}
          // The selected wallet's own store pairs its trades with its own balance
          knownTrades={isSelectedWallet ? undefined : trades}
        />
      )}
    </PanelSheet>
  );
});

function SpotPnlSheetContent({
  tokenAddress,
  chainId,
  walletAddress,
  ensName,
  isSelectedWallet,
  knownTrades,
}: {
  tokenAddress: string;
  chainId: ChainId;
  walletAddress: string;
  ensName: string | undefined;
  isSelectedWallet: boolean;
  knownTrades: WalletTokenTrades | undefined;
}) {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const uniqueId = getUniqueId(tokenAddress, chainId);
  const accountAsset = useAccountAsset(uniqueId, nativeCurrency);
  const { data: externalToken } = useExternalToken({ address: tokenAddress, chainId, currency: nativeCurrency });
  const symbol = accountAsset?.symbol ?? externalToken?.symbol ?? '';

  // A null wallet fetches nothing when the trades are already known
  const otherWalletTradesStore = useStableValue(() =>
    createTokenTradesStore({
      params: {
        walletAddress: knownTrades ? null : walletAddress,
        codexTokenId: getCodexTokenId(tokenAddress, chainId),
        heldBalance: null,
      },
    })
  );
  const tradesStore = isSelectedWallet ? useTokenTradesStore : otherWalletTradesStore;
  const fetchedTrades = tradesStore(state => state.getData());
  const isFetchSuccess = tradesStore(state => state.getStatus('isSuccess'));
  const isFetchError = tradesStore(state => state.getStatus('isError'));
  const trades = knownTrades ?? fetchedTrades;
  const isSuccess = !!knownTrades || isFetchSuccess;
  const isSettled = isSuccess || isFetchError;
  // Codex lists only a token's traders, so a wallet that never bought it may have no record at all
  const isReceivedOnly = isSuccess && !greaterThanWorklet(trades?.purchasedTokenBalance ?? '0', 0);
  // The selected wallet uses its own assets, as the pill does, rather than Codex's indexed balance
  const balance = isSelectedWallet ? accountAsset?.balance?.amount || '0' : (trades?.tokenBalanceLive ?? '0');

  return (
    <Box paddingTop={{ custom: 22 }} paddingBottom={{ custom: 14 }}>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" gap={12} paddingHorizontal={{ custom: 22 }}>
        <Box flexDirection="row" alignItems="center" gap={12}>
          <RainbowCoinIcon
            size={30}
            chainId={chainId}
            color={accountAsset?.color ?? externalToken?.colors?.primary}
            icon={accountAsset?.icon_url ?? externalToken?.iconUrl ?? undefined}
            showBadge={false}
            symbol={symbol}
          />
          <Text color="label" size="20pt" weight="heavy">
            {symbol}
          </Text>
        </Box>
        <WalletChip walletAddress={walletAddress} ensName={ensName} />
      </Box>
      <SpotPnlSection
        balance={balance}
        chainId={chainId}
        decimals={accountAsset?.decimals ?? externalToken?.decimals ?? 18}
        initialPrice={accountAsset?.native?.price?.amount ?? externalToken?.native?.price?.amount ?? ''}
        initialPriceUpdatedAt={accountAsset?.price?.changed_at ?? 0}
        isReceivedOnly={isReceivedOnly}
        isSettled={isSettled}
        nativeCurrency={nativeCurrency}
        symbol={symbol}
        tokenAddress={tokenAddress}
        tokenName={accountAsset?.name ?? externalToken?.name}
        trades={trades}
        uniqueId={uniqueId}
      />
    </Box>
  );
}

function SpotPnlSection({
  balance,
  chainId,
  decimals,
  initialPrice,
  initialPriceUpdatedAt,
  isReceivedOnly,
  isSettled,
  nativeCurrency,
  symbol,
  tokenAddress,
  tokenName,
  trades,
  uniqueId,
}: {
  balance: string;
  chainId: ChainId;
  decimals: number;
  initialPrice: string;
  initialPriceUpdatedAt: number;
  isReceivedOnly: boolean;
  isSettled: boolean;
  nativeCurrency: NativeCurrencyKey;
  symbol: string;
  tokenAddress: string;
  tokenName: string | undefined;
  trades: WalletTokenTrades | null;
  uniqueId: string;
}) {
  const usdToNativeRate = useCurrencyConversionStore(state => state.getData()?.usdToNativeCurrencyConversionRate);
  const { data: metadata } = useAdditionalAssetData({ address: tokenAddress, chainId, currency: nativeCurrency });
  const price = useLiveTokenValue({
    tokenId: uniqueId,
    fallback: initialPrice,
    fallbackUpdatedAt: initialPriceUpdatedAt,
  });
  const liveMarketCap = useLiveTokenValue({
    tokenId: uniqueId,
    fallback: '0',
    selector: selectCirculatingMarketCap,
  });
  const marketCap = greaterThanWorklet(liveMarketCap, 0) ? liveMarketCap : String(metadata?.marketCap ?? 0);
  // Tokens priced under $1 show entry and current market caps in place of prices
  const circulatingSupply =
    usdToNativeRate &&
    greaterThanWorklet(price || '0', 0) &&
    lessThanWorklet(divWorklet(price, usdToNativeRate), 1) &&
    greaterThanWorklet(marketCap, 0)
      ? divWorklet(marketCap, price)
      : null;

  const pnl = useMemo(
    () => (trades && usdToNativeRate ? calculateSpotPnl({ trades, balance, price: price || '0', usdToNativeRate }) : null),
    [balance, price, trades, usdToNativeRate]
  );

  const lastTradeAt = trades?.lastTransactionAt;
  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (hasTrackedView.current || !pnl || !tokenName || lastTradeAt === undefined) return;
    hasTrackedView.current = true;
    analytics.track(analytics.event.spotPnlSheetViewed, {
      tokenName,
      tokenAddress,
      chainId,
      variant: pnl.variant,
      pnlUsd: Number(pnl.headlineUsd),
      lastTradeAt,
    });
  }, [chainId, lastTradeAt, pnl, tokenAddress, tokenName]);

  return pnl ? (
    <SpotPnlBody asset={{ decimals, symbol }} circulatingSupply={circulatingSupply} nativeCurrency={nativeCurrency} pnl={pnl} />
  ) : (
    <SpotPnlPlaceholder isReceivedOnly={isReceivedOnly} isSettled={isSettled} />
  );
}

function selectCirculatingMarketCap(token: TokenData): string {
  return token.marketData.circulatingMarketCap;
}

function SpotPnlPlaceholder({ isReceivedOnly, isSettled }: { isReceivedOnly: boolean; isSettled: boolean }) {
  const hasUsdToNativeRate = useCurrencyConversionStore(state => !!state.getData()?.usdToNativeCurrencyConversionRate);

  return (
    <Box alignItems="center" justifyContent="center" height={{ custom: PLACEHOLDER_HEIGHT }}>
      {isSettled && hasUsdToNativeRate ? (
        <Box alignItems="center" gap={22} style={{ maxWidth: 306 }}>
          <Text align="center" color="label" size="22pt" weight="heavy">
            {i18n.t(i18n.l.spot_pnl_sheet.nothing_to_show)}
          </Text>
          {isReceivedOnly && (
            <Text align="center" color="labelSecondary" size="17pt / 135%" weight="bold">
              {i18n.t(i18n.l.spot_pnl_sheet.nothing_to_show_description)}
            </Text>
          )}
        </Box>
      ) : (
        <ActivityIndicator />
      )}
    </Box>
  );
}

function WalletChip({ walletAddress, ensName }: { walletAddress: string; ensName: string | undefined }) {
  const { accountColor, accountENS, accountImage, accountName, accountSymbol } = useAccountProfileInfo(walletAddress as Address);
  const displayEns = accountENS ?? ensName;
  const { data: ensAvatar } = useENSAvatar(ensName ?? '', { enabled: !accountImage && !!ensName });

  return (
    <Box
      backgroundColor="fillQuaternary"
      borderColor="separatorTertiary"
      borderRadius={CARD_BORDER_RADIUS}
      borderWidth={1}
      flexDirection="row"
      flexShrink={1}
      alignItems="center"
      gap={6}
      paddingLeft={{ custom: 6 }}
      paddingRight={{ custom: 12 }}
      paddingVertical={{ custom: 10 }}
    >
      <Box height={{ custom: 10 }} justifyContent="center">
        <AddressAvatar
          address={walletAddress}
          color={accountColor}
          emoji={accountSymbol || undefined}
          label={accountName ?? ''}
          size={18}
          url={accountImage ?? ensAvatar?.imageUrl}
        />
      </Box>
      <Text color="labelSecondary" size="13pt" weight="bold" numberOfLines={1} style={{ flexShrink: 1 }}>
        {abbreviateEnsForDisplay(displayEns) ?? abbreviateAddress(walletAddress, 4, 6)}
      </Text>
    </Box>
  );
}

function SpotPnlBody({
  asset,
  circulatingSupply,
  nativeCurrency,
  pnl,
}: {
  asset: { decimals: number; symbol: string };
  /** Set when per-token figures show as market caps rather than prices. */
  circulatingSupply: string | null;
  nativeCurrency: NativeCurrencyKey;
  pnl: SpotPnl;
}) {
  const format = (amount: string) => formatNativeAmount(amount, nativeCurrency);
  const formatPerToken = (price: string) =>
    circulatingSupply ? format(mulWorklet(price, circulatingSupply)) : formatAssetPrice({ value: price, currency: nativeCurrency });
  const labels = circulatingSupply
    ? {
        avgEntry: i18n.l.spot_pnl_sheet.avg_entry_mc,
        avgExit: i18n.l.spot_pnl_sheet.avg_exit_mc,
        current: i18n.l.spot_pnl_sheet.current_mc,
      }
    : { avgEntry: i18n.l.spot_pnl_sheet.avg_entry, avgExit: i18n.l.spot_pnl_sheet.avg_exit, current: i18n.l.spot_pnl_sheet.current };
  const excludedDisplay = greaterThanWorklet(pnl.excludedBalance, 0) ? formatCompactTokenAmount(pnl.excludedBalance, asset) : null;

  return (
    <Box gap={12} paddingHorizontal="16px" paddingTop={{ custom: 44 }}>
      {pnl.variant === 'fullyRealized' ? (
        <RealizedHeadline nativeCurrency={nativeCurrency} realized={pnl.realized} />
      ) : (
        <PositionHeadline nativeCurrency={nativeCurrency} pnl={pnl.position} value={format(pnl.position.value)} />
      )}
      <Box
        backgroundColor="fillQuaternary"
        borderColor="separatorTertiary"
        borderRadius={CARD_BORDER_RADIUS}
        borderWidth={1}
        flexDirection="row"
        marginTop={{ custom: pnl.variant === 'fullyRealized' ? 28 : 20 }}
        paddingHorizontal={{ custom: 4 }}
        paddingVertical="20px"
      >
        <Figure label={i18n.t(i18n.l.spot_pnl_sheet.invested)} value={format(pnl.invested)} />
        <Figure label={i18n.t(labels.avgEntry)} value={formatPerToken(pnl.avgEntry)} />
        {pnl.variant === 'fullyRealized' ? (
          <Figure label={i18n.t(labels.avgExit)} value={formatPerToken(pnl.avgExit)} />
        ) : (
          <Figure label={i18n.t(labels.current)} value={formatPerToken(pnl.current)} />
        )}
      </Box>
      {pnl.variant !== 'fullyRealized' && (
        <Box
          backgroundColor="fillQuaternary"
          borderColor="separatorTertiary"
          borderRadius={CARD_BORDER_RADIUS}
          borderWidth={1}
          gap={16}
          padding="16px"
        >
          <ReturnRow
            label={i18n.t(i18n.l.spot_pnl_sheet.realized_return)}
            nativeCurrency={nativeCurrency}
            value={pnl.variant === 'partiallyRealized' ? pnl.realized : null}
          />
          {pnl.variant === 'partiallyRealized' && (
            <>
              <Separator color="separatorTertiary" thickness={1} />
              <ReturnRow label={i18n.t(i18n.l.spot_pnl_sheet.total_return)} nativeCurrency={nativeCurrency} value={pnl.total} />
            </>
          )}
        </Box>
      )}
      {excludedDisplay && (
        <ButtonPressAnimation onPress={() => Navigation.handleAction(Routes.SPOT_PNL_EXCLUDED_TOKENS_SHEET)}>
          <Box flexDirection="row" alignItems="center" justifyContent="center" gap={8} paddingHorizontal="16px" paddingVertical="8px">
            <Text align="center" color="labelTertiary" size="15pt / 135%" weight="medium">
              <Text color="labelSecondary" size="15pt / 135%" weight="bold">
                {excludedDisplay}
              </Text>
              {` ${i18n.t(i18n.l.spot_pnl_sheet.excluded_from_calculation)}`}
            </Text>
            <InfoIcon />
          </Box>
        </ButtonPressAnimation>
      )}
    </Box>
  );
}

function PositionHeadline({ nativeCurrency, pnl, value }: { nativeCurrency: NativeCurrencyKey; pnl: UnrealizedPnl; value: string }) {
  const { colors } = useTheme();
  const { direction, display } = formatPnlAmount(pnl.amount, nativeCurrency);
  const color = pnlColor(direction, colors);

  return (
    <Box flexDirection="row" alignItems="flex-end" justifyContent="space-between" gap={16} paddingHorizontal="16px">
      <Box flexShrink={1} gap={16}>
        <Text color="labelTertiary" size="15pt" weight="bold">
          {i18n.t(i18n.l.spot_pnl_sheet.unrealized_position)}
        </Text>
        <Text color="label" size="30pt" weight="heavy" numberOfLines={1}>
          {value}
        </Text>
      </Box>
      <Box alignItems="flex-end" gap={12}>
        <Box flexDirection="row" alignItems="center" gap={2}>
          <PnlArrow color={color} direction={direction} size="12pt" weight="black" />
          <GlowText color={color} size="17pt" weight="heavy">
            {formatPnlPercentage(pnl.percentage)}
          </GlowText>
        </Box>
        <Box flexDirection="row" alignItems="center" gap={3}>
          {direction !== 'flat' && (
            <GlowText color={color} size="20pt" weight="heavy">
              {pnlSign(direction)}
            </GlowText>
          )}
          <GlowText color={color} size="22pt" weight="heavy">
            {display}
          </GlowText>
        </Box>
      </Box>
    </Box>
  );
}

function RealizedHeadline({ nativeCurrency, realized }: { nativeCurrency: NativeCurrencyKey; realized: PnlReturn }) {
  const { colors } = useTheme();
  const { direction, display } = formatPnlAmount(realized.amount, nativeCurrency);
  const color = pnlColor(direction, colors);

  return (
    <Box alignItems="center" gap={16}>
      <Text color="labelTertiary" size="15pt" weight="bold">
        {i18n.t(i18n.l.spot_pnl_sheet.realized_return)}
      </Text>
      <Box flexDirection="row" alignItems="center" gap={2}>
        {direction !== 'flat' && (
          <GlowText color={color} size="30pt" weight="heavy">
            {pnlSign(direction)}
          </GlowText>
        )}
        <GlowText color={color} size="34pt" weight="heavy">
          {display}
        </GlowText>
      </Box>
      {realized.percentage !== null && (
        <Box flexDirection="row" alignItems="center" gap={2}>
          <PnlArrow color={color} direction={direction} size="12pt" weight="black" />
          <GlowText color={color} size="17pt" weight="heavy">
            {formatPnlPercentage(realized.percentage)}
          </GlowText>
        </Box>
      )}
    </Box>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <Box alignItems="center" flexBasis={0} flexGrow={1} gap={12}>
      <Text align="center" color="labelTertiary" size="15pt" weight="semibold">
        {label}
      </Text>
      <Text align="center" color="label" size="15pt" weight="bold">
        {value}
      </Text>
    </Box>
  );
}

function ReturnRow({
  label,
  nativeCurrency,
  value,
}: {
  label: string;
  nativeCurrency: NativeCurrencyKey;
  /** `null` when nothing was sold. */
  value: PnlReturn | null;
}) {
  const { colors } = useTheme();
  const amount = value && formatPnlAmount(value.amount, nativeCurrency);

  return (
    <Box flexDirection="row" alignItems="center" justifyContent="space-between" gap={10}>
      <Text color="labelTertiary" size="15pt" weight="semibold">
        {label}
      </Text>
      {amount && value ? (
        <Box flexDirection="row" flexGrow={1} flexShrink={1} alignItems="center" justifyContent="flex-end" gap={8}>
          {value.percentage !== null && (
            <Box flexDirection="row" alignItems="center" gap={2}>
              <PnlArrow color="labelTertiary" direction={amount.direction} size="11pt" weight="heavy" />
              <Text color="labelTertiary" size="15pt" weight="bold">
                {formatPnlPercentage(value.percentage)}
              </Text>
            </Box>
          )}
          <Text color={pnlColor(amount.direction, colors)} size="15pt" weight="bold">
            {`${pnlSign(amount.direction)}${amount.display}`}
          </Text>
        </Box>
      ) : (
        <Text color="labelQuaternary" size="15pt" weight="bold">
          {i18n.t(i18n.l.spot_pnl_sheet.nothing_sold_yet)}
        </Text>
      )}
    </Box>
  );
}

function GlowText({ children, color, size, weight }: Pick<TextProps, 'color' | 'size' | 'weight'> & { children: string }) {
  return (
    <TextShadow blur={12} shadowOpacity={0.24}>
      <Text color={color} size={size} weight={weight}>
        {children}
      </Text>
    </TextShadow>
  );
}

function InfoIcon() {
  return (
    <Text color="labelQuaternary" size="15pt" weight="bold">
      {'􀅴'}
    </Text>
  );
}
