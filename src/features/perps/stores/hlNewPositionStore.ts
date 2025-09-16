import { PerpMarket, PerpPositionSide, TriggerOrderType } from '@/features/perps/types';
import { infoClient } from '@/features/perps/services/hyperliquid-account-client';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { divide } from '@/helpers/utilities';
import { toFixedWorklet } from '@/safe-math/SafeMath';

type TriggerOrder = {
  localId: string;
  isMarket: boolean;
  price: string;
  orderFraction: string;
  type: TriggerOrderType;
};

type HlNewPositionState = {
  positionSide: PerpPositionSide;
  leverage: number | null;
  amount: string;
  triggerOrders: TriggerOrder[];
  market: PerpMarket | null;
};

type HlNewPositionActions = {
  setMarket: (market: PerpMarket) => void;
  setPositionSide: (positionSide: PerpPositionSide) => void;
  setLeverage: (leverage: number) => void;
  setAmount: (amount: string) => void;
  addTriggerOrder: (triggerOrder: TriggerOrder) => void;
  removeTriggerOrder: (triggerOrderId: string) => void;
  reset: () => void;
};

type HlNewPositionStore = HlNewPositionState & HlNewPositionActions;

export const useHlNewPositionStore = createRainbowStore<HlNewPositionStore>((set, get) => ({
  positionSide: PerpPositionSide.LONG,
  leverage: null,
  amount: '0',
  triggerOrders: [],
  market: null,

  setMarket: async (market: PerpMarket) => {
    // We do not have a relialbe way to reset this after the transition ends when leaving the screen, so we do it here
    get().reset();

    set({ market });
    // Whenever the market changes, we need to fetch the users account leverage for this asset
    const address = useWalletsStore.getState().accountAddress;
    const data = await infoClient.activeAssetData({
      user: address,
      coin: market.symbol,
    });
    const accountAssetLeverage = data?.leverage?.value || 1;
    const availableBalance = data?.availableToTrade[0] ?? 0;
    set({ leverage: accountAssetLeverage, amount: toFixedWorklet(divide(availableBalance, 2), 2) });
  },
  setPositionSide: positionSide => set({ positionSide }),
  setLeverage: leverage => {
    set({ leverage });
  },
  setAmount: amount => {
    set({ amount });
  },
  addTriggerOrder: triggerOrder => {
    set(state => ({ triggerOrders: [...state.triggerOrders, triggerOrder] }));
  },
  removeTriggerOrder: triggerOrderId => {
    set(state => ({
      triggerOrders: state.triggerOrders.filter(order => order.localId !== triggerOrderId),
    }));
  },
  reset: () => {
    set({
      positionSide: PerpPositionSide.LONG,
      leverage: null,
      amount: '0',
      triggerOrders: [],
      market: null,
    });
  },
}));

export const hlNewPositionStoreActions = createStoreActions(useHlNewPositionStore);
