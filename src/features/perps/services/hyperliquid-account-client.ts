import {
  type ClearinghouseStateResponse,
  type HistoricalOrdersResponse,
  type UserAbstractionResponse,
  type UserFillsResponse,
} from '@nktkas/hyperliquid';
import { type Address } from 'viem';

import { RAINBOW_BUILDER_SETTINGS } from '@/features/perps/constants';
import { infoClient } from '@/features/perps/services/hyperliquid-info-client';
import { hyperliquidDexActions } from '@/features/perps/stores/hyperliquidDexStore';
import { normalizeDexSymbol } from '@/features/perps/utils/hyperliquidSymbols';
import { add, greaterThan, subtract } from '@/helpers/utilities';

import { PerpPositionSide, type PerpAccount, type PerpsPosition } from '../types';

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

    const [accountAbstractionMode, spotState, clearinghouseStates] = await Promise.all([
      this.getAbstractionMode(),
      infoClient.spotClearinghouseState({ user: this.userAddress }, abortSignal),
      Promise.all(
        dexIds.map(dex => infoClient.clearinghouseState({ user: this.userAddress, dex }, abortSignal).then(state => ({ state, dex })))
      ),
    ]);

    const positions = buildPositions(clearinghouseStates);

    if (accountAbstractionMode !== 'unifiedAccount') {
      let value = '0';
      let balance = '0';
      clearinghouseStates.forEach(({ state }) => {
        value = add(value, state.marginSummary?.accountValue ?? '0');
        balance = add(balance, state.withdrawable ?? '0');
      });
      return { value, balance, positions };
    }

    const usdc = spotState.balances.find(b => b.coin === 'USDC');
    const usdcTotal = usdc?.total ?? '0';
    const usdcHold = usdc?.hold ?? '0';

    return {
      value: usdcTotal,
      balance: subtract(usdcTotal, usdcHold),
      positions,
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

  async isOrderFilled(orderId: number): Promise<boolean> {
    const orderStatus = await infoClient.orderStatus({
      user: this.userAddress,
      oid: orderId,
    });

    return orderStatus.status === 'order' && orderStatus.order.status === 'filled';
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

  async getAbstractionMode(): Promise<UserAbstractionResponse> {
    return await infoClient.userAbstraction({ user: this.userAddress });
  }
}

function buildPositions(clearinghouseStates: { state: ClearinghouseStateResponse; dex: string }[]): Record<string, PerpsPosition> {
  const positions: PerpsPosition[] = [];

  clearinghouseStates.forEach(({ state, dex }) => {
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

  const positionsBySymbol = positions.reduce<Record<string, PerpsPosition>>((acc, position) => {
    acc[position.symbol] = position;
    return acc;
  }, {});

  return positionsBySymbol;
}
