import { add, greaterThan } from '@/helpers/utilities';
import { HistoricalOrdersResponse, UserFillsResponse } from '@nktkas/hyperliquid';
import { Address } from 'viem';
import { RAINBOW_BUILDER_SETTINGS } from '@/features/perps/constants';
import { PerpPositionSide, PerpAccount, PerpsPosition } from '../types';
import { normalizeDexSymbol } from '@/features/perps/utils/hyperliquidSymbols';
import { infoClient } from '@/features/perps/services/hyperliquid-info-client';
import { hyperliquidDexActions } from '@/features/perps/stores/hyperliquidDexStore';

export class HyperliquidAccountClient {
  constructor(private userAddress: Address) {}

  async getPerpAccountPnl() {
    const portfolioData = await infoClient.portfolio({ user: this.userAddress });

    const portfolioMap = new Map(portfolioData);

    const getLatestPnl = (pnlHistory: [number, string][]): string => {
      if (!pnlHistory || pnlHistory.length === 0) return '0';
      return pnlHistory[pnlHistory.length - 1][1];
    };

    const dayPnl = getLatestPnl(portfolioMap.get('day')?.pnlHistory || []);
    const weekPnl = getLatestPnl(portfolioMap.get('week')?.pnlHistory || []);
    const allTimePnl = getLatestPnl(portfolioMap.get('allTime')?.pnlHistory || []);

    return {
      pnl: {
        '1d': dayPnl,
        '1w': weekPnl,
        'all': allTimePnl,
      },
    };
  }

  async getPerpAccount(abortSignal: AbortSignal | undefined): Promise<PerpAccount> {
    await hyperliquidDexActions.fetch();
    const dexIds = hyperliquidDexActions.getDexIds();
    const clearinghouseStates = await Promise.all(
      dexIds.map(async dex => {
        const state = await infoClient.clearinghouseState(
          {
            user: this.userAddress,
            dex,
          },
          abortSignal
        );

        return { state, dex };
      })
    );

    let totalAccountValue = '0';
    let totalWithdrawable = '0';
    const positions: PerpsPosition[] = [];

    clearinghouseStates.forEach(({ state, dex }) => {
      const accountValue = state.marginSummary?.accountValue ?? '0';
      const withdrawable = state.withdrawable ?? '0';

      totalAccountValue = add(totalAccountValue, accountValue);
      totalWithdrawable = add(totalWithdrawable, withdrawable);

      state.assetPositions.forEach(({ position }) => {
        const symbol = normalizeDexSymbol(position.coin, dex);
        const equity = position.leverage.type === 'isolated' ? position.marginUsed : add(position.unrealizedPnl, position.marginUsed);

        positions.push({
          symbol,
          side: greaterThan(position.szi, 0) ? PerpPositionSide.LONG : PerpPositionSide.SHORT,
          leverage: position.leverage.value,
          liquidationPrice: position.liquidationPx,
          entryPrice: position.entryPx,
          value: position.positionValue,
          unrealizedPnl: position.unrealizedPnl,
          returnOnEquity: position.returnOnEquity,
          marginUsed: position.marginUsed,
          size: position.szi,
          equity,
          funding: position.cumFunding.sinceOpen,
          dex,
        });
      });
    });

    positions.sort((a, b) => Number(b.equity) - Number(a.equity));

    const positionsBySymbol = positions.reduce(
      (acc, position) => {
        acc[position.symbol] = position;
        return acc;
      },
      {} as Record<string, PerpsPosition>
    );

    return {
      value: totalAccountValue,
      balance: totalWithdrawable,
      positions: positionsBySymbol,
    };
  }

  async hasAccount(): Promise<boolean> {
    const check = await infoClient.preTransferCheck({
      user: this.userAddress,
      source: this.userAddress,
    });
    return check.userExists;
  }

  async getHistoricalOrders(abortSignal: AbortSignal | undefined): Promise<HistoricalOrdersResponse> {
    return await infoClient.historicalOrders(
      {
        user: this.userAddress,
      },
      abortSignal
    );
  }

  async getFilledOrders(abortSignal: AbortSignal | undefined): Promise<UserFillsResponse> {
    return await infoClient.userFills(
      {
        user: this.userAddress,
        aggregateByTime: true,
      },
      abortSignal
    );
  }

  async isBuilderFeeApproved(): Promise<boolean> {
    const approvedBuilderFee = await infoClient.maxBuilderFee({
      builder: RAINBOW_BUILDER_SETTINGS.b,
      user: this.userAddress,
    });
    return approvedBuilderFee >= RAINBOW_BUILDER_SETTINGS.f;
  }

  async isReferralCodeSet(): Promise<boolean> {
    const referral = await infoClient.referral({
      user: this.userAddress,
    });
    return referral.referredBy !== null;
  }

  async isDexAbstractionEnabled(): Promise<boolean> {
    return (await infoClient.userDexAbstraction({ user: this.userAddress })) ?? false;
  }
}
