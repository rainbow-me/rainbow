import { createQueryStore } from '@storesjs/stores';

import { time } from '@/framework/core/utils/time';
import { add } from '@/helpers/utilities';
import ethUnits from '@/references/ethereum-units.json';

import type { Records } from '../../types/registration';
import {
  estimateENSCommitGasLimit,
  estimateENSRegisterSetRecordsAndNameGasLimit,
  estimateENSRenewGasLimit,
  estimateENSSetNameGasLimit,
  estimateENSSetRecordsGasLimit,
} from '../../utils/handlers';
import { ENS_DOMAIN, generateSalt, REGISTRATION_STEPS } from '../../utils/helpers';

type GasEstimateInput = {
  name: string;
  ownerAddress: string;
  step: keyof typeof REGISTRATION_STEPS;
  duration?: number;
  rentPrice?: string;
  salt?: string;
  records: Records;
  setReverseRecord?: boolean;
};

/**
 * Estimates the current ENS operation. Dispose of the store when its inputs change.
 */
export function createEnsGasEstimateStore(input: GasEstimateInput, enabled: boolean) {
  return createQueryStore({
    fetcher: () => estimateGas(input),
    enabled: enabled && !!input.name && !!input.ownerAddress,
    disableAutoRefetching: true,
    staleTime: time.seconds(15),
  });
}

async function estimateGas(input: GasEstimateInput) {
  let stepGasLimit: string | null;
  switch (input.step) {
    case REGISTRATION_STEPS.COMMIT: {
      if (!input.name.endsWith(ENS_DOMAIN) || !input.duration || !input.rentPrice) return null;
      const [commit, records, reverse] = await Promise.all([
        estimateENSCommitGasLimit({ ...input, salt: generateSalt() }),
        estimateENSSetRecordsGasLimit({ name: input.name, records: input.records }),
        input.setReverseRecord ? estimateENSSetNameGasLimit(input) : '0',
      ]);
      return {
        stepGasLimit: commit,
        estimatedGasLimit:
          commit !== null && records !== null && reverse !== null
            ? add(add(commit, records), add(ethUnits.ens_register_with_config, reverse))
            : null,
      };
    }
    case REGISTRATION_STEPS.REGISTER:
      if (!input.name.endsWith(ENS_DOMAIN) || !input.duration || !input.rentPrice || !input.salt) return null;
      stepGasLimit = await estimateENSRegisterSetRecordsAndNameGasLimit(input);
      break;
    case REGISTRATION_STEPS.RENEW:
      if (!input.name.endsWith(ENS_DOMAIN) || !input.duration || !input.rentPrice) return null;
      stepGasLimit = await estimateENSRenewGasLimit({ name: input.name, duration: input.duration, rentPrice: input.rentPrice });
      break;
    case REGISTRATION_STEPS.EDIT:
      stepGasLimit = await estimateENSSetRecordsGasLimit(input);
      break;
    case REGISTRATION_STEPS.SET_NAME:
      stepGasLimit = await estimateENSSetNameGasLimit(input);
      break;
    default:
      return null;
  }
  return { stepGasLimit, estimatedGasLimit: stepGasLimit };
}
