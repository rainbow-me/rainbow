import { createBaseStore, type Store } from '@storesjs/stores';

import { getInitialSliderAmount } from '@/components/amount-input-card/getInitialSliderAmount';

type OrderFormState = {
  buyAmount: string;
};

type OrderFormActions = {
  setBuyAmount: (amount: string) => void;
};

type OrderFormStoreState = OrderFormState & OrderFormActions;

export type OrderFormStore = Store<OrderFormStoreState>;

export function createOrderFormStore(initialBalance: string): OrderFormStore {
  return createBaseStore<OrderFormStoreState>(set => ({
    buyAmount: getInitialSliderAmount(initialBalance),
    setBuyAmount: amount =>
      set(state => {
        if (state.buyAmount === amount) return state;
        return { buyAmount: amount };
      }),
  }));
}
