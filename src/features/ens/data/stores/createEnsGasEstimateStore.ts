import { createQueryStore } from '@storesjs/stores';

import { time } from '@/framework/core/utils/time';
import { add } from '@/helpers/utilities';
import { type Route } from '@/navigation/routesNames';
import ethUnits from '@/references/ethereum-units.json';
import { useNavigationStore } from '@/state/navigation/navigationStore';

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

type GasEstimate = {
  stepGasLimit: string | null;
  estimatedGasLimit: string | null;
} | null;

type GasEstimateParams = { input: GasEstimateInput | null };

/**
 * Estimates the current ENS operation while its screen is active.
 */
export function createEnsGasEstimateStore(route: Route) {
  return createQueryStore<GasEstimate, GasEstimateParams, GasEstimateParams>(
    {
      fetcher: estimateGas,
      enabled: ($, store) => {
        const input = $(store, s => s.input);
        const isActive = $(useNavigationStore, s => s.isRouteActive(route));
        if (!isActive || !input?.name || !input?.ownerAddress) return false;
        return true;
      },
      params: { input: ($, store) => $(store, s => s.input) },
      disableAutoRefetching: true,
      staleTime: time.seconds(15),
    },

    () => ({ input: null })
  );
}

async function estimateGas(params: GasEstimateParams): Promise<GasEstimate> {
  const input = params.input;
  if (!input) return null;

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
          commit === null || records === null || reverse === null
            ? null
            : add(add(commit, records), add(ethUnits.ens_register_with_config, reverse)),
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
