import { nanoid } from 'nanoid';

import { ChainId } from '@/features/network/types/backendNetworks';

import { mockRampClient } from './mockRampClient';
import { RampCryptoAsset, RampNetwork, type BuyOrder, type BuyOrderSpec, type RampAsset, type RampClient } from './rampClient';

export type CashOrderDestination = {
  chainId: ChainId;
  cryptoAsset: RampAsset;
};

export interface CashOrderService {
  createBuyOrder(params: BuyOrderSpec): Promise<BuyOrder>;
  createBuyOrderSpec(params: Omit<BuyOrderSpec, 'id'>): BuyOrderSpec;
  getDestination(): CashOrderDestination;
  getOrder(orderId: string): Promise<BuyOrder>;
}

class MockCashOrderService implements CashOrderService {
  private readonly destination: CashOrderDestination;
  private readonly rampClient: RampClient;

  constructor({ destination, rampClient }: { destination: CashOrderDestination; rampClient: RampClient }) {
    this.destination = destination;
    this.rampClient = rampClient;
  }

  createBuyOrder({ cardId, depositAmount, id, walletAddress }: BuyOrderSpec): Promise<BuyOrder> {
    return this.rampClient.createBuyOrder({
      cardId,
      cryptoAsset: this.destination.cryptoAsset,
      depositAmount,
      id,
      walletAddress,
    });
  }

  createBuyOrderSpec({ cardId, depositAmount, walletAddress }: Omit<BuyOrderSpec, 'id'>): BuyOrderSpec {
    return { cardId, depositAmount, walletAddress, id: nanoid() };
  }

  getDestination(): CashOrderDestination {
    return this.destination;
  }

  getOrder(orderId: string): Promise<BuyOrder> {
    return this.rampClient.getOrder(orderId);
  }
}

export const cashOrderService: CashOrderService = new MockCashOrderService({
  // For now we're hardcoding it, we might later make it configurable form firebase
  // or allow user to pick it themselves
  destination: {
    chainId: ChainId.base,
    cryptoAsset: { asset: RampCryptoAsset.USDC, network: RampNetwork.Base },
  },
  rampClient: mockRampClient,
});
