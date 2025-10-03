import { PerpMarket, PerpPositionSide, TriggerOrderType } from '@/features/perps/types';
import { infoClient } from '@/features/perps/services/hyperliquid-account-client';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { divide } from '@/helpers/utilities';
import { greaterThanWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import { hyperliquidAccountActions } from '@/features/perps/stores/hyperliquidAccountStore';
import { PerpsNavigation } from '@/features/perps/screens/PerpsNavigator';
import Routes from '@/navigation/routesNames';

type TriggerOrder = {
  localId: string;
  isMarket: boolean;
  price: string;
  orderFraction: string;
  type: TriggerOrderType;
};

type HlNewPositionState = {
  amount: string;
  leverage: number | null;
  leverageResetSignal: number;
  market: PerpMarket | null;
  marketResetSignal: number;
  positionSide: PerpPositionSide;
  triggerOrders: TriggerOrder[];
};

type HlNewPositionActions = {
  addTriggerOrder: (triggerOrder: TriggerOrder) => void;
  getLeverage: () => number | null;
  getMaxLeverage: () => number;
  removeTriggerOrder: (triggerOrderId: string) => void;
  setAmount: (amount: string) => void;
  setLeverage: (leverage: number | null) => void;
  setMarket: (market: PerpMarket) => Promise<void>;
  setPositionSide: (positionSide: PerpPositionSide) => void;
};

type HlNewPositionStore = HlNewPositionState & HlNewPositionActions;

const initialState: HlNewPositionState = {
  amount: '0',
  leverage: null,
  leverageResetSignal: 0,
  market: null,
  marketResetSignal: 0,
  positionSide: PerpPositionSide.LONG,
  triggerOrders: [],
};

export const useHlNewPositionStore = createRainbowStore<HlNewPositionStore>((set, get) => ({
  ...initialState,

  addTriggerOrder: triggerOrder =>
    set(state => ({
      triggerOrders: [...state.triggerOrders, triggerOrder],
    })),

  getLeverage: () => {
    const { leverage, market } = get();
    if (!leverage || !market) return leverage ?? 1;
    return Math.min(leverage, market.maxLeverage);
  },

  getMaxLeverage: () => get().market?.maxLeverage ?? 1,

  removeTriggerOrder: triggerOrderId =>
    set(state => ({
      triggerOrders: state.triggerOrders.filter(order => order.localId !== triggerOrderId),
    })),

  setAmount: amount => set(state => (state.amount === amount ? state : { amount })),

  setLeverage: leverage =>
    set(state => {
      if (leverage === null) return { leverage };
      const maxLeverage = state.market?.maxLeverage;
      const newLeverage = Math.min(leverage, maxLeverage ?? leverage);
      if (state.leverage === newLeverage) return state;
      return { leverage: newLeverage };
    }),

  setMarket: async market => {
    const availableBalance = hyperliquidAccountActions.getBalance();
    const amount = toFixedWorklet(greaterThanWorklet(availableBalance, 5) ? divide(availableBalance, 2) : availableBalance, 2);

    // Ensure old state is reset before the new position screen is shown
    set(state => ({ ...initialState, amount, leverage: market.maxLeverage, market, marketResetSignal: state.marketResetSignal + 1 }));
    PerpsNavigation.setParams(Routes.PERPS_SEARCH_SCREEN, { type: 'newPosition' });

    // Whenever the market changes, we need to fetch the user's account leverage for this asset
    const requestId = get().marketResetSignal;
    const address = useWalletsStore.getState().accountAddress;
    const assetData = await infoClient.activeAssetData({ coin: market.symbol, user: address });
    const accountAssetLeverage = assetData?.leverage?.value || 1;

    set(state =>
      state.leverage === accountAssetLeverage || requestId !== state.marketResetSignal
        ? state
        : {
            leverage: accountAssetLeverage,
            leverageResetSignal: state.leverageResetSignal + 1,
          }
    );
  },

  setPositionSide: positionSide => set(state => (state.positionSide === positionSide ? state : { positionSide })),
}));

export const hlNewPositionStoreActions = createStoreActions(useHlNewPositionStore);
