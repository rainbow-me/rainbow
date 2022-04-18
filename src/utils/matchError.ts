export default function mirrorKeys<
  Key extends string,
  MirroredKeys = { [K in Key]: K }
>(keys: Key[]): MirroredKeys {
  return keys.reduce((acc, current) => {
    acc[current] = current;
    return acc;
  }, {});
}

// Array<Key>.reduce<{}>(callbackfn: (previousValue: {}, currentValue: Key, currentIndex: number, array: Key[]) => {}, initialValue: {}): {}

export const errorsCode = mirrorKeys([
  //keychain

  'KEYCHAIN_ERROR',
  'KEYCHAIN_ERROR_AUTHENTICATING',
  'KEYCHAIN_CANCEL',
  'KEYCHAIN_FACE_UNLOCK_CANCEL',

  'CAN_ACCESS_SECRET_PHRASE',

  //biometry
  'CREATED_WITH_BIOMETRY_ERROR',
  'CAN_NOT_ADD_ENS',
  'CAN_ADD_UNSTOPPABLE_NAME',
  'ERROR_WHILE_ENTERING_PASSWORD',
  'WALLET_WAS_CREATED_WITH_PIN_BUT_PIN_IS_MISSING',
  'DECRYPT_ANDROID_PIN_ERROR',

  'ERROR_IN_RESTORE_SPECIFIC_BACKUP_INTO_KEYCHAIN',
  'ERROR_IN_RESTORE_BACKUP_INTO_KEYCHAIN',

  //other
  'SOME_ANOTHER_ERROR',
]);

export function matchError(error: string): typeof errorsCode {
  // const { message: msgKey } = error;
  return Object.keys(errorsCode).reduce((acc, item) => {
    acc[item] = error === item;
    return acc;
  }, {});
}
