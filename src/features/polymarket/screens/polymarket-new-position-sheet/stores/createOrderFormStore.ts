import { createBaseStore, type Store } from '@storesjs/stores';

import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { divWorklet, greaterThanWorklet } from '@/framework/core/safeMath';

type OrderFormState = {
  buyAmount: string;
};

type OrderFormActions = {
  setBuyAmount: (amount: string) => void;
};

type OrderFormStoreState = OrderFormState & OrderFormActions;

export type OrderFormStore = Store<OrderFormStoreState>;

export function createOrderFormStore(): OrderFormStore {
  const availableBalance = usePolymarketBalanceStore.getState().getBalance();
  const halfBalance = divWorklet(availableBalance, 2);
  const initialBuyAmount = greaterThanWorklet(availableBalance, '5') ? halfBalance : availableBalance;

  return createBaseStore<OrderFormStoreState>(set => ({
    buyAmount: initialBuyAmount,
    setBuyAmount: amount =>
      set(state => {
        if (state.buyAmount === amount) return state;
        return { buyAmount: amount };
      }),
  }));
}
