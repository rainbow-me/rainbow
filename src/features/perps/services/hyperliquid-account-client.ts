import { divide, greaterThan, multiply } from '@/helpers/utilities';
import * as hl from '@nktkas/hyperliquid';
import { Address } from 'viem';
import { PerpPositionSide, PerpAccount, FilledOrder } from '../types';
import { describeFill } from '@/features/perps/utils';

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
    const [perpState, openOrders] = await Promise.all([
      infoClient.clearinghouseState({
        user: this.userAddress,
      }),
      infoClient.frontendOpenOrders({ user: this.userAddress }),
    ]);

    const positions = perpState.assetPositions.map(({ position }) => {
      const tpslOrders = openOrders.filter(order => order.coin === position.coin && order.isPositionTpsl === true);

      const takeProfitOrders = tpslOrders.filter(
        order => order.triggerCondition === 'tp' || order.orderType === 'Take Profit Market' || order.orderType === 'Take Profit Limit'
      );
      const stopLossOrders = tpslOrders.filter(
        order => order.triggerCondition === 'sl' || order.orderType === 'Stop Market' || order.orderType === 'Stop Limit'
      );

      // TODO: it's possible to have multiple tp/sl orders, need to figure out how we want to handle this in the UI
      const takeProfit =
        takeProfitOrders.length > 0
          ? {
              // TODO: transform needed fields into our own type
              orders: takeProfitOrders,
              price: takeProfitOrders[0].triggerPx,
            }
          : null;
      const stopLoss =
        stopLossOrders.length > 0
          ? {
              // TODO: transform needed fields into our own type
              orders: stopLossOrders,
              price: stopLossOrders[0].triggerPx,
            }
          : null;

      return {
        symbol: position.coin,
        side: greaterThan(position.szi, 0) ? PerpPositionSide.LONG : PerpPositionSide.SHORT,
        leverage: position.leverage.value,
        liquidationPrice: position.liquidationPx,
        entryPrice: position.entryPx,
        value: position.positionValue,
        unrealizedPnl: position.unrealizedPnl,
        unrealizedPnlPercent: divide(position.unrealizedPnl, position.positionValue),
        funding: position.cumFunding.allTime,
        takeProfit,
        stopLoss,
      };
    });

    return {
      balance: perpState.withdrawable,
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

  async getFilledOrders(): Promise<FilledOrder[]> {
    const fills = await infoClient.userFills({
      user: this.userAddress,
    });

    fills.sort((a, b) => b.time - a.time);

    const userOrders: FilledOrder[] = fills.map(fill => {
      const value = multiply(fill.px, fill.sz);
      const description = describeFill(fill);

      return {
        timestamp: new Date(fill.time),
        symbol: fill.coin,
        description,
        side: fill.side === 'B' ? 'Buy' : 'Sell',
        size: fill.sz,
        price: fill.px,
        value,
        pnl: fill.closedPnl,
        fee: fill.fee,
        orderId: fill.oid,
        tradeId: fill.tid,
        txHash: fill.hash,
        isLiquidation: !!fill.liquidation,
        liquidationType: fill.liquidation?.method,
      };
    });

    return userOrders;
  }
}
