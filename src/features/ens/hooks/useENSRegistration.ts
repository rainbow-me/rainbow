import { useCallback, useMemo } from 'react';

import { useAccountAddress } from '@/state/wallets/walletsStore';

import { getChangedRecords } from '../core/records';
import { useEnsRegistrationStore } from '../data/stores/registrationStore';
import type { Records } from '../types/registration';
import type { REGISTRATION_MODES } from '../utils/helpers';

const EMPTY_RECORDS: Records = {};

/**
 * Selects the active wallet's registration draft and derives its pending record writes.
 */
export function useENSRegistration() {
  const accountAddress = useAccountAddress().toLowerCase();
  const current = useEnsRegistrationStore(s => (s.current?.accountAddress === accountAddress ? s.current : null));
  const registration = useEnsRegistrationStore(s => (current ? s.registrations[accountAddress]?.[current.name] : undefined));
  const name = current?.name ?? '';
  const records = registration?.records ?? EMPTY_RECORDS;
  const initialRecords = registration?.initialRecords ?? EMPTY_RECORDS;
  const changedRecords = useMemo(() => getChangedRecords(records, initialRecords), [records, initialRecords]);
  const registrationParameters = registration ?? null;

  const updateRecords = useCallback(
    (records: Records) => {
      if (!current) return;
      useEnsRegistrationStore.getState().update(accountAddress, name, { records });
    },
    [accountAddress, current, name]
  );
  const updateRecordByKey = useCallback(
    (key: string, value: string) => {
      if (!current) return;
      const store = useEnsRegistrationStore.getState();
      store.update(accountAddress, name, { records: { ...store.registrations[accountAddress]?.[name]?.records, [key]: value } });
    },
    [accountAddress, current, name]
  );
  const removeRecordByKey = useCallback(
    (key: string) => {
      if (!current) return;
      const store = useEnsRegistrationStore.getState();
      const records = { ...store.registrations[accountAddress]?.[name]?.records };
      delete records[key];
      store.update(accountAddress, name, { records });
    },
    [accountAddress, current, name]
  );

  const startRegistration = useCallback(
    (name: string, mode: keyof typeof REGISTRATION_MODES) => {
      useEnsRegistrationStore.getState().start(accountAddress, name, mode);
    },
    [accountAddress]
  );
  const removeRegistrationByName = useCallback(
    (name: string) => useEnsRegistrationStore.getState().remove(accountAddress, name),
    [accountAddress]
  );

  return {
    accountAddress,
    initialRecords,
    mode: registration?.mode,
    name,
    records,
    changedRecords,
    registrationParameters,
    removeRecordByKey,
    removeRegistrationByName,
    startRegistration,
    updateRecordByKey,
    updateRecords,
  };
}
