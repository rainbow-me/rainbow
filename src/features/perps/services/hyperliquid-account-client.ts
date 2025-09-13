import { greaterThan } from '@/helpers/utilities';
import * as hl from '@nktkas/hyperliquid';
import { Address } from 'viem';
import { PerpPositionSide, PerpAccount, PerpsPosition } from '../types';
import { sumWorklet } from '@/safe-math/SafeMath';

const transport = new hl.HttpTransport();
export const infoClient: hl.InfoClient = new hl.InfoClient({
  transport,
});

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

  async getPerpAccount(): Promise<PerpAccount> {
    const perpState = await infoClient.clearinghouseState({
      user: this.userAddress,
    });

    const positions = perpState.assetPositions
      .map(({ position }) => {
        const equity =
          position.leverage.type === 'isolated' ? sumWorklet(position.marginUsed, position.unrealizedPnl) : position.unrealizedPnl;

        return {
          symbol: position.coin,
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
        };
      })
      .sort((a, b) => Number(b.equity) - Number(a.equity));

    const positionsBySymbol = positions.reduce(
      (acc, position) => {
        acc[position.symbol] = position;
        return acc;
      },
      {} as Record<string, PerpsPosition>
    );

    return {
      value: perpState.marginSummary.accountValue,
      balance: perpState.withdrawable,
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

  async getHistoricalOrders(): Promise<hl.OrderStatus<hl.FrontendOrder>[]> {
    return await infoClient.historicalOrders({
      user: this.userAddress,
    });
  }

  async getFilledOrders(): Promise<hl.Fill[]> {
    return await infoClient.userFills({
      user: this.userAddress,
    });
  }
}
