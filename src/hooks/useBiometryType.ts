import { isNil } from 'lodash';
import { useEffect, useState } from 'react';
import { isPinOrFingerprintSet } from 'react-native-device-info';
import useAppState from './useAppState';
import useIsMounted from './useIsMounted';
import usePrevious from './usePrevious';
import { BiometryTypes } from '@/helpers';
import * as keychain from '@/keychain';

export default function useBiometryType() {
  const { justBecameActive } = useAppState();
  const isMounted = useIsMounted();
  const [biometryType, setBiometryType] = useState(null);
  const prevBiometricType = usePrevious(biometryType);

  useEffect(() => {
    const getSupportedBiometryType = async () => {
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

      if (isMounted.current && type !== prevBiometricType) {
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'BIOMETRY_TYPE | null' is not ass... Remove this comment to see the full error message
        setBiometryType(type);
      }
    };

    if (!biometryType || justBecameActive) {
      getSupportedBiometryType();
    }
  }, [biometryType, isMounted, justBecameActive, prevBiometricType]);

  return biometryType;
}
