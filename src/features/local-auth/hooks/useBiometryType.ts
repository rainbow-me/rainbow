import { useState } from 'react';

import { useListen } from '@storesjs/stores';
import { isNil } from 'lodash';
import { isPinOrFingerprintSet } from 'react-native-device-info';

import { useAppStateStore } from '@/state/appState/appStateStore';

import * as keychain from '../keychain';
import { BiometryTypes } from '../types/biometryTypes';

type BiometryType = keyof typeof BiometryTypes;

export function useBiometryType(): BiometryType | null {
  const [biometryType, setBiometryType] = useState<BiometryType | null>(null);

  const listener = useListen(
    useAppStateStore,
    s => s === 'active',
    async isActive => {
      if (!isActive) return;
      let type = await keychain.getSupportedBiometryType();

      if (isNil(type)) {
        // 💡️ When `getSupportedBiometryType` returns `null` it can mean either:
        //    A) the user has no device passcode/biometrics at all
        //    B) the user has gone into Settings and disabled biometrics specifically for Rainbow
        // @ts-expect-error ts-migrate(2322) FIXME: Type 'string | null' is not assignable to type 'BI... Remove this comment to see the full error message
        type = await isPinOrFingerprintSet().then(isPinOrFingerprintSet =>
          isPinOrFingerprintSet ? BiometryTypes.passcode : BiometryTypes.none
        );
      }

      if (listener.current.isActive) {
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'BIOMETRY_TYPE | null' is not ass... Remove this comment to see the full error message
        setBiometryType(type);
      }
    },
    { fireImmediately: true }
  );

  return biometryType;
}
