import { DerivedValue } from 'react-native-reanimated';
import {
  MinifiedAsset,
  usePerpsDepositController,
} from '@/features/perps/screens/perps-deposit-withdraw-screen/hooks/usePerpsDepositController';
import { PerpsDepositAmountStoreType } from '@/features/perps/screens/perps-deposit-withdraw-screen/stores/createPerpsDepositAmountStore';
import { PerpsDepositGasStoresType } from '@/features/perps/screens/perps-deposit-withdraw-screen/stores/createPerpsDepositGasStore';
import { PerpsDepositStoreType } from '@/features/perps/screens/perps-deposit-withdraw-screen/stores/createPerpsDepositStore';
import { PerpsDepositQuoteStoreType } from '@/features/perps/screens/perps-deposit-withdraw-screen/stores/createPerpsDepositQuoteStore';
import { PerpsAmountToReceiveStore } from '@/features/perps/screens/perps-deposit-withdraw-screen/stores/derived/createAmountToReceiveStore';
import { StoreActions } from '@/state/internal/utils/createStoreActions';

export enum QuoteStatus {
  Error = 'error',
  InsufficientBalance = 'insufficientBalance',
  Pending = 'pending',
  Success = 'success',
  ZeroAmountError = 'errorZeroAmount',
}

export type PerpsDepositContextType = {
  depositActions: StoreActions<PerpsDepositAmountStoreType & PerpsDepositStoreType>;
  gasStores: PerpsDepositGasStoresType;
  handleDeposit: () => Promise<void>;
  minifiedAsset: DerivedValue<MinifiedAsset>;
  quoteActions: StoreActions<PerpsDepositQuoteStoreType>;
  useAmountStore: PerpsDepositAmountStoreType;
  useAmountToReceive: PerpsAmountToReceiveStore;
  useDepositStore: PerpsDepositStoreType;
  useQuoteStore: PerpsDepositQuoteStoreType;
} & ReturnType<typeof usePerpsDepositController>;
