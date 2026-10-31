import { getQueryKey } from '@storesjs/stores';

import { time } from '@/framework/core/utils/time';
import { createQueryCollectionStore } from '@/state/internal/createQueryCollectionStore';

import type { Records } from '../../types/registration';
import {
  estimateENSCommitGasLimit,
  estimateENSRegisterSetRecordsAndNameGasLimit,
  estimateENSRenewGasLimit,
  estimateENSSetNameGasLimit,
  estimateENSSetRecordsGasLimit,
} from '../../utils/handlers';
import { generateSalt } from '../../utils/helpers';

type GasEstimateInput = { name: string } & (
  | { action: 'commit'; ownerAddress: string; duration: number; rentPrice: string }
  | {
      action: 'register';
      ownerAddress: string;
      duration: number;
      rentPrice: string;
      salt: string;
      records: Records;
      setReverseRecord?: boolean;
    }
  | { action: 'renew'; duration: number; rentPrice: string }
  | { action: 'setName'; ownerAddress: string }
  | { action: 'setRecords'; ownerAddress?: string; records: Records; setReverseRecord?: boolean }
);

export const useEnsGasEstimateStore = createQueryCollectionStore({
  key: (input: GasEstimateInput) => getQueryKey(input),
  fetcher: input => {
    switch (input.action) {
      case 'commit':
        return estimateENSCommitGasLimit({ ...input, salt: generateSalt() });
      case 'register':
        return estimateENSRegisterSetRecordsAndNameGasLimit(input);
      case 'renew':
        return estimateENSRenewGasLimit(input);
      case 'setName':
        return estimateENSSetNameGasLimit(input);
      case 'setRecords':
        return estimateENSSetRecordsGasLimit(input);
    }
  },
  disableAutoRefetching: true,
  staleTime: time.seconds(15),
  cacheTime: time.minutes(5),
});
