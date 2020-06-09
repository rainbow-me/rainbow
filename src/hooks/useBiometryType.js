import { isNil } from 'lodash';
import { useEffect, useState } from 'react';
import { isPinOrFingerprintSet } from 'react-native-device-info';
import * as Keychain from 'react-native-keychain';
import BiometryTypes from '../helpers/biometryTypes';
import useAppState from './useAppState';
import usePrevious from './usePrevious';

export default function useBiometryType() {
  const { justBecameActive } = useAppState();
  const [biometryType, setBiometryType] = useState(null);
  const prevBiometricType = usePrevious(biometryType);

  useEffect(() => {
    let mounted = true;

    const getSupportedBiometryType = async () => {
      let type = await Keychain.getSupportedBiometryType();

      if (isNil(type)) {
        // 💡️ When `getSupportedBiometryType` returns `null` it can mean either:
        //    A) the user has no device passcode/biometrics at all
        //    B) the user has gone into Settings and disabled biometrics specifically for Rainbow
        type = await isPinOrFingerprintSet().then(isPinOrFingerprintSet =>
          isPinOrFingerprintSet ? BiometryTypes.passcode : BiometryTypes.none
        );
      }

      if (mounted && type !== prevBiometricType) {
        setBiometryType(type);
      }
    };

    if (!biometryType || justBecameActive) {
      getSupportedBiometryType();
    }

    return () => {
      mounted = false;
    };
  }, [biometryType, justBecameActive, prevBiometricType]);

  return biometryType;
}
