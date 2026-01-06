import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { divWorklet, greaterThanWorklet } from '@/safe-math/SafeMath';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { RainbowStore } from '@/state/internal/types';

type OrderFormState = {
  buyAmount: string;
};

type OrderFormActions = {
  setBuyAmount: (amount: string) => void;
};

type OrderFormStoreState = OrderFormState & OrderFormActions;

export type OrderFormStore = RainbowStore<OrderFormStoreState>;

export function createOrderFormStore(): OrderFormStore {
  const availableBalance = usePolymarketBalanceStore.getState().getBalance();
  const halfBalance = divWorklet(availableBalance, 2);
  const initialBuyAmount = greaterThanWorklet(availableBalance, '5') ? halfBalance : availableBalance;

  return createRainbowStore<OrderFormStoreState>(set => ({
    buyAmount: initialBuyAmount,
    setBuyAmount: amount =>
      set(state => {
        if (state.buyAmount === amount) return state;
        return { buyAmount: amount };
      }),
  }));
}
