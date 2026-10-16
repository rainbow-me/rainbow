import React, { memo, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator } from 'react-native';

import { type Address } from 'viem';

import { analytics } from '@/analytics';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { ImgixImage } from '@/components/images';
import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, Separator, Text, TextShadow } from '@/design-system';
import { type TextProps } from '@/design-system/components/Text/Text';
import { getUniqueId } from '@/entities/assetId';
import { useCurrencyConversionStore } from '@/features/currency/stores/currencyConversionStore';
import type { NativeCurrencyKey } from '@/features/currency/types';
import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import useENSAvatar from '@/features/ens/hooks/useENSAvatar';
import type { ChainId } from '@/features/network/types/backendNetworks';
import { greaterThanWorklet } from '@/framework/core/safeMath';
import { convertAmountToBalanceDisplay } from '@/helpers/utilities';
import useAccountAsset from '@/hooks/useAccountAsset';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import { useRoute } from '@/navigation/RouteContext';
import Routes from '@/navigation/routesNames';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme/ThemeContext';
import { address as abbreviateAddress, abbreviateEnsForDisplay } from '@/utils/abbreviations';

import {
  calculateSpotPnl,
  type PnlReturn,
  type SpotPnl,
  type SpotPnlHolder,
  type SpotPnlWalletSource,
  type TokenTrades,
} from '../core/spotPnl';
import { type UnrealizedPnl } from '../core/unrealizedPnl';
import { useTokenTradesStore } from '../data/tokenTradesStore';
import { formatPnlAmount, formatPnlPercentage, PnlArrow, pnlColor, pnlSign } from './pnlDisplay';

const SHEET_BORDER_RADIUS = 38;
const CARD_BORDER_RADIUS = 22;
const LOADING_HEIGHT = 120;

type SpotPnlExplainType = 'spot_pnl_excluded_tokens' | 'spot_pnl_realized_window';

export const SpotPnlSheet = memo(function SpotPnlSheet() {
  const {
    params: { address, chainId, holder },
  } = useRoute<typeof Routes.SPOT_PNL_SHEET>();
  const selectedWalletAddress = userAssetsStoreManager(state => state.address);

  return (
    <PanelSheet borderRadius={SHEET_BORDER_RADIUS} innerBorderWidth={1}>
      {(holder || selectedWalletAddress) && (
        <SpotPnlSheetContent tokenAddress={address} chainId={chainId} holder={holder} selectedWalletAddress={selectedWalletAddress} />
      )}
    </PanelSheet>
  );
});

function SpotPnlSheetContent({
  tokenAddress,
  chainId,
  holder,
  selectedWalletAddress,
}: {
  tokenAddress: string;
  chainId: ChainId;
  holder: SpotPnlHolder | undefined;
  selectedWalletAddress: string | null;
}) {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const uniqueId = getUniqueId(tokenAddress, chainId);
  const accountAsset = useAccountAsset(uniqueId, nativeCurrency);
  const { data: externalToken } = useExternalToken({ address: tokenAddress, chainId, currency: nativeCurrency });
  const symbol = accountAsset?.symbol ?? externalToken?.symbol ?? '';
  const token: PnlToken = {
    chainId,
    decimals: accountAsset?.decimals ?? externalToken?.decimals ?? 18,
    initialPrice: accountAsset?.native?.price?.amount ?? externalToken?.native?.price?.amount ?? '',
    initialPriceUpdatedAt: accountAsset?.price?.changed_at ?? 0,
    nativeCurrency,
    symbol,
    tokenAddress,
    tokenName: accountAsset?.name ?? externalToken?.name,
    uniqueId,
  };

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
        {holder ? (
          <WalletChip ensName={holder.ensName} walletAddress={holder.address} />
        ) : (
          selectedWalletAddress && <SelectedWalletChip walletAddress={selectedWalletAddress} />
        )}
      </Box>
      {holder ? (
        <SpotPnlSection balance={holder.balance} isSettled token={token} trades={holder.trades} walletSource="top_holder" />
      ) : (
        <SelectedWalletSpotPnlSection balance={accountAsset?.balance?.amount || '0'} token={token} />
      )}
    </Box>
  );
}

type PnlToken = {
  chainId: ChainId;
  decimals: number;
  initialPrice: string;
  initialPriceUpdatedAt: number;
  nativeCurrency: NativeCurrencyKey;
  symbol: string;
  tokenAddress: string;
  tokenName: string | undefined;
  uniqueId: string;
};

function SelectedWalletSpotPnlSection({ balance, token }: { balance: string; token: PnlToken }) {
  const trades = useTokenTradesStore(state => state.getData());
  const isSettled = useTokenTradesStore(state => state.getStatus('isSuccess') || state.getStatus('isError'));
  return <SpotPnlSection balance={balance} isSettled={isSettled} token={token} trades={trades} walletSource="selected" />;
}

function SpotPnlSection({
  balance,
  isSettled,
  token: { chainId, decimals, initialPrice, initialPriceUpdatedAt, nativeCurrency, symbol, tokenAddress, tokenName, uniqueId },
  trades,
  walletSource,
}: {
  balance: string;
  /** Whether `trades` is final rather than still loading. */
  isSettled: boolean;
  token: PnlToken;
  trades: TokenTrades | null;
  walletSource: SpotPnlWalletSource;
}) {
  const usdToNativeRate = useCurrencyConversionStore(state => state.getData()?.usdToNativeCurrencyConversionRate);
  const price = useLiveTokenValue({
    tokenId: uniqueId,
    initialValue: initialPrice,
    initialValueLastUpdated: initialPriceUpdatedAt,
    selector: token => token.price,
  });

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
      walletSource,
    });
  }, [chainId, lastTradeAt, pnl, tokenAddress, tokenName, walletSource]);

  return pnl ? (
    <SpotPnlBody asset={{ decimals, symbol }} nativeCurrency={nativeCurrency} pnl={pnl} />
  ) : (
    <SpotPnlPlaceholder isSettled={isSettled} />
  );
}

function SpotPnlPlaceholder({ isSettled }: { isSettled: boolean }) {
  const hasUsdToNativeRate = useCurrencyConversionStore(state => !!state.getData()?.usdToNativeCurrencyConversionRate);

  return (
    <Box alignItems="center" justifyContent="center" height={{ custom: LOADING_HEIGHT }}>
      {isSettled && hasUsdToNativeRate ? (
        <Text color="labelTertiary" size="15pt" weight="semibold">
          {i18n.t(i18n.l.spot_pnl_sheet.nothing_to_show)}
        </Text>
      ) : (
        <ActivityIndicator />
      )}
    </Box>
  );
}

function SelectedWalletChip({ walletAddress }: { walletAddress: string }) {
  const { accountENS } = useAccountProfileInfo(walletAddress as Address);
  return <WalletChip ensName={accountENS ?? null} walletAddress={walletAddress} />;
}

function WalletChip({ ensName: accountENS, walletAddress }: { ensName: string | null; walletAddress: string }) {
  const { data: avatar } = useENSAvatar(accountENS ?? '', { enabled: !!accountENS });

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
      paddingLeft={{ custom: accountENS && avatar?.imageUrl ? 6 : 12 }}
      paddingRight={{ custom: 12 }}
      paddingVertical={{ custom: 10 }}
    >
      {accountENS && avatar?.imageUrl && (
        <Box height={{ custom: 10 }} justifyContent="center">
          <ImgixImage size={18} source={{ uri: avatar.imageUrl }} style={{ borderRadius: 9, height: 18, width: 18 }} />
        </Box>
      )}
      <Text color="labelSecondary" size="13pt" weight="bold" numberOfLines={1} style={{ flexShrink: 1 }}>
        {abbreviateEnsForDisplay(accountENS ?? undefined) ?? abbreviateAddress(walletAddress, 4, 6)}
      </Text>
    </Box>
  );
}

function SpotPnlBody({
  asset,
  nativeCurrency,
  pnl,
}: {
  asset: { decimals: number; symbol: string };
  nativeCurrency: NativeCurrencyKey;
  pnl: SpotPnl;
}) {
  const format = (amount: string) => convertAmountToNativeDisplay(amount, nativeCurrency);
  const excludedDisplay = greaterThanWorklet(pnl.excludedBalance, 0) ? convertAmountToBalanceDisplay(pnl.excludedBalance, asset) : null;

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
        <Figure label={i18n.t(i18n.l.spot_pnl_sheet.avg_entry)} value={format(pnl.avgEntry)} />
        {pnl.variant === 'fullyRealized' ? (
          <Figure label={i18n.t(i18n.l.spot_pnl_sheet.avg_exit)} value={format(pnl.avgExit)} />
        ) : (
          <Figure label={i18n.t(i18n.l.spot_pnl_sheet.current)} value={format(pnl.current)} />
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
            explain="spot_pnl_realized_window"
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
        <ButtonPressAnimation onPress={() => openExplainSheet('spot_pnl_excluded_tokens')}>
          <Box flexDirection="row" alignItems="center" justifyContent="center" gap={8} paddingVertical="8px">
            <Text color="labelTertiary" size="15pt / 135%" weight="medium">
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
    <Box flexDirection="row" flexWrap="wrap" alignItems="flex-end" justifyContent="space-between" gap={16} paddingHorizontal="16px">
      <Box gap={16}>
        <Text color="labelTertiary" size="15pt" weight="bold">
          {i18n.t(i18n.l.spot_pnl_sheet.unrealized_position)}
        </Text>
        <Text color="label" size="30pt" weight="heavy" tabularNumbers>
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
      <ExplainLabel explain="spot_pnl_realized_window" label={i18n.t(i18n.l.spot_pnl_sheet.realized_return)} weight="bold" />
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
      <Text align="center" color="label" size="15pt" weight="bold" tabularNumbers>
        {value}
      </Text>
    </Box>
  );
}

function ReturnRow({
  explain,
  label,
  nativeCurrency,
  value,
}: {
  explain?: SpotPnlExplainType;
  label: string;
  nativeCurrency: NativeCurrencyKey;
  /** `null` when nothing was sold. */
  value: PnlReturn | null;
}) {
  const { colors } = useTheme();
  const amount = value && formatPnlAmount(value.amount, nativeCurrency);

  return (
    <Box flexDirection="row" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap={10}>
      {explain ? (
        <ExplainLabel explain={explain} label={label} weight="semibold" />
      ) : (
        <Text color="labelTertiary" size="15pt" weight="semibold">
          {label}
        </Text>
      )}
      {amount && value ? (
        <Box flexDirection="row" flexGrow={1} alignItems="center" justifyContent="flex-end" gap={8}>
          {value.percentage !== null && (
            <Box flexDirection="row" alignItems="center" gap={3}>
              <PnlArrow color="labelTertiary" direction={amount.direction} size="10pt" weight="heavy" />
              <Text color="labelTertiary" size="15pt" weight="bold" tabularNumbers>
                {formatPnlPercentage(value.percentage)}
              </Text>
            </Box>
          )}
          <Text color={pnlColor(amount.direction, colors)} size="15pt" weight="bold" tabularNumbers>
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
      <Text color={color} size={size} weight={weight} tabularNumbers>
        {children}
      </Text>
    </TextShadow>
  );
}

function ExplainLabel({ explain, label, weight }: { explain: SpotPnlExplainType; label: string; weight: TextProps['weight'] }) {
  return (
    <ButtonPressAnimation onPress={() => openExplainSheet(explain)}>
      <Box flexDirection="row" alignItems="center" gap={4}>
        <Text color="labelTertiary" size="15pt" weight={weight}>
          {label}
        </Text>
        <InfoIcon />
      </Box>
    </ButtonPressAnimation>
  );
}

function InfoIcon() {
  return (
    <Text color="labelQuaternary" size="15pt" weight="bold">
      {'􀅴'}
    </Text>
  );
}

function openExplainSheet(type: SpotPnlExplainType) {
  Navigation.handleAction(Routes.EXPLAIN_SHEET, { type });
}
