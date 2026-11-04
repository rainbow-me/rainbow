import { createBaseStore, type Store } from '@storesjs/stores';

import { divWorklet, greaterThanWorklet } from '@/framework/core/safeMath';

type OrderFormState = {
  buyAmount: string;
};

type OrderFormActions = {
  setBuyAmount: (amount: string) => void;
};

type OrderFormStoreState = OrderFormState & OrderFormActions;

export type OrderFormStore = Store<OrderFormStoreState>;

export function createOrderFormStore(initialBalance: string): OrderFormStore {
  const initialBuyAmount = greaterThanWorklet(initialBalance, '5') ? divWorklet(initialBalance, 2) : initialBalance;

  return createBaseStore<OrderFormStoreState>(set => ({
    buyAmount: initialBuyAmount,
    setBuyAmount: amount =>
      set(state => {
        if (state.buyAmount === amount) return state;
        return { buyAmount: amount };
      }),
  }));
}
