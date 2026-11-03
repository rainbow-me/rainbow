import { createQueryStore } from '@storesjs/stores';
import { getAddress } from 'viem';

import { time } from '@/framework/core/utils/time';
import { type Route } from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';

import { REGISTRATION_STEPS, type EnsCommitment, type Records } from '../../types/registration';
import type { EnsAction } from '../../types/transactions';
import { createEnsCommitment } from '../registration';
import { estimateEnsRegistration, estimateEnsTransactions } from '../transactions';

type GasEstimateInput = {
  name: string;
  account: string;
  step: keyof typeof REGISTRATION_STEPS;
  duration: number;
  commitment?: EnsCommitment;
  records: Records;
  setReverseRecord: boolean;
};

type GasEstimate = { step: string; total: string } | null;
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
        return isActive && input !== null;
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

  const account = getAddress(input.account);
  let action: EnsAction;
  switch (input.step) {
    case REGISTRATION_STEPS.COMMIT: {
      const commitment = await createEnsCommitment(account, input.duration);
      return estimateEnsRegistration(
        { type: 'register', name: input.name, commitment, records: input.records, setReverseRecord: input.setReverseRecord },
        account
      );
    }
    case REGISTRATION_STEPS.REGISTER:
      if (!input.commitment) return null;
      action = {
        type: 'register',
        name: input.name,
        commitment: input.commitment,
        records: input.records,
        setReverseRecord: input.setReverseRecord,
      };
      break;
    case REGISTRATION_STEPS.RENEW:
      action = { type: 'renew', name: input.name, duration: input.duration };
      break;
    case REGISTRATION_STEPS.EDIT:
      action = { type: 'records', name: input.name, records: input.records, setReverseRecord: input.setReverseRecord };
      break;
    case REGISTRATION_STEPS.SET_NAME:
      action = { type: 'primary', name: input.name };
      break;
    default:
      return null;
  }

  const gas = await estimateEnsTransactions(action, account);
  return { step: gas, total: gas };
}
