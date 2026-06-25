import { nanoid } from 'nanoid';

import { ChainId } from '@/features/network/types/backendNetworks';

import { type AuthSession, type LinkedCard } from './authSession';
import { mockAuthSession } from './mockAuthSession';
import { mockRampClient } from './mockRampClient';
import { RampCryptoAsset, RampNetwork, type BuyOrder, type BuyOrderSpec, type RampAsset, type RampClient } from './rampClient';

export type CashOrderDestination = {
  chainId: ChainId;
  cryptoAsset: RampAsset;
};

export type CreateCashBuyOrderParams = {
  depositAmount: string;
  id: string;
  walletAddress: string;
};

export interface CashOrderService {
  createBuyOrder(params: CreateCashBuyOrderParams): Promise<BuyOrder>;
  createBuyOrderSpec(params: Omit<BuyOrderSpec, 'id'>): BuyOrderSpec;
  getDestination(): CashOrderDestination;
  getLinkedCard(): LinkedCard;
  getOrder(orderId: string): Promise<BuyOrder>;
}

class MockCashOrderService implements CashOrderService {
  private readonly authSession: AuthSession;
  private readonly destination: CashOrderDestination;
  private readonly rampClient: RampClient;

  constructor({
    authSession,
    destination,
    rampClient,
  }: {
    authSession: AuthSession;
    destination: CashOrderDestination;
    rampClient: RampClient;
  }) {
    this.authSession = authSession;
    this.destination = destination;
    this.rampClient = rampClient;
  }

  createBuyOrder({ depositAmount, id, walletAddress }: BuyOrderSpec): Promise<BuyOrder> {
    return this.rampClient.createBuyOrder({
      cardId: this.getLinkedCard().id,
      cryptoAsset: this.destination.cryptoAsset,
      depositAmount,
      id,
      walletAddress,
    });
  }

  createBuyOrderSpec({ depositAmount, walletAddress }: Omit<BuyOrderSpec, 'id'>): BuyOrderSpec {
    return { depositAmount, walletAddress, id: nanoid() };
  }

  getDestination(): CashOrderDestination {
    return this.destination;
  }

  getLinkedCard(): LinkedCard {
    return this.authSession.getLinkedCard();
  }

  getOrder(orderId: string): Promise<BuyOrder> {
    return this.rampClient.getOrder(orderId);
  }
}

export const cashOrderService: CashOrderService = new MockCashOrderService({
  authSession: mockAuthSession,
  // For now we're hardcoding it, we might later make it configurable form firebase
  // or allow user to pick it themselves
  destination: {
    chainId: ChainId.base,
    cryptoAsset: { asset: RampCryptoAsset.USDC, network: RampNetwork.Base },
  },
  rampClient: mockRampClient,
});
