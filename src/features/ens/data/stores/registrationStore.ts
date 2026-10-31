import { createBaseStore } from '@storesjs/stores';

import { time } from '@/framework/core/utils/time';

import type { ENSRegistrations, Records, RegistrationParameters } from '../../types/registration';
import type { REGISTRATION_MODES } from '../../utils/helpers';

// ============ Types ========================================================== //

type RegistrationState = {
  current: { accountAddress: string; name: string } | null;
  registrations: ENSRegistrations;
  start: (accountAddress: string, name: string, mode: keyof typeof REGISTRATION_MODES) => void;
  update: (accountAddress: string, name: string, changes: Partial<RegistrationParameters>) => void;
  /** Adopts the server baseline once per edit session without replacing typed values. */
  initializeRecords: (accountAddress: string, name: string, records: Records) => void;
  remove: (accountAddress: string, name: string) => void;
  removeExpired: (accountAddress: string) => void;
  /** Removes the wallet's registrations and active session. */
  removeAccount: (accountAddress: string) => void;
  clear: () => void;
};

// ============ Registration State ============================================= //

/**
 * Owns registration drafts and pending commitments by wallet and name.
 * Transaction callbacks update their original wallet/name, independently of navigation.
 */
export const useEnsRegistrationStore = createBaseStore<RegistrationState>(
  (set, get) => {
    return {
      current: null,
      registrations: {},

      start: (accountAddress, name, mode) => {
        const account = accountAddress.toLowerCase();
        set(state => {
          const registration = state.registrations[account]?.[name];
          const sameSession = state.current?.accountAddress === account && state.current.name === name && registration?.mode === mode;
          return {
            current: { accountAddress: account, name },
            registrations: {
              ...state.registrations,
              [account]: {
                ...state.registrations[account],
                [name]: {
                  ...registration,
                  ...(mode === 'EDIT' && !sameSession && { records: undefined, initialRecords: undefined }),
                  name,
                  mode,
                },
              },
            },
          };
        });
      },

      update: (accountAddress, name, changes) => {
        const account = accountAddress.toLowerCase();
        set(state => ({
          registrations: {
            ...state.registrations,
            [account]: {
              ...state.registrations[account],
              [name]: { ...state.registrations[account]?.[name], ...changes, name },
            },
          },
        }));
      },

      initializeRecords: (accountAddress, name, records) => {
        const registration = get().registrations[accountAddress.toLowerCase()]?.[name];
        if (registration && !registration.initialRecords) {
          get().update(accountAddress, name, { initialRecords: records, records: { ...records, ...registration.records } });
        }
      },

      remove: (accountAddress, name) => {
        const account = accountAddress.toLowerCase();
        set(state => {
          const registrations = { ...state.registrations[account] };
          delete registrations[name];
          return { registrations: { ...state.registrations, [account]: registrations } };
        });
      },

      removeExpired: accountAddress => {
        const account = accountAddress.toLowerCase();
        const cutoff = Date.now() - time.days(7);
        set(state => ({
          registrations: {
            ...state.registrations,
            [account]: Object.fromEntries(
              Object.entries(state.registrations[account] ?? {}).filter(
                ([, registration]) => !registration.commitTransactionConfirmedAt || registration.commitTransactionConfirmedAt >= cutoff
              )
            ),
          },
        }));
      },

      removeAccount: accountAddress => {
        const account = accountAddress.toLowerCase();
        set(state => {
          const registrations = { ...state.registrations };
          delete registrations[account];
          return {
            registrations,
            current: state.current?.accountAddress === account ? null : state.current,
          };
        });
      },

      clear: () => set({ current: null }),
    };
  },
  {
    storageKey: 'ensRegistrations',
    // A submitted commitment must be durable before its transaction callback returns.
    persistThrottleMs: 0,
    partialize: state => {
      const registrations: ENSRegistrations = {};
      for (const account in state.registrations) {
        for (const [name, registration] of Object.entries(state.registrations[account])) {
          if (registration.commitTransactionHash) (registrations[account] ??= {})[name] = registration;
        }
      }
      return { registrations };
    },
  }
);
