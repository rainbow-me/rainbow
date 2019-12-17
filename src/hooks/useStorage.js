import { useCallback } from 'react';
import {
  removeStatePersist,
  useStatePersist,
} from 'react-native-hooks-persist';

const DEFAULT_DB_NAME = 'globalStorage';

export default function useStorage(key, defaultValue, db = DEFAULT_DB_NAME) {
  const [value, update] = useStatePersist(db, key, defaultValue);
  const remove = useCallback(() => removeStatePersist(db, key), [db, key]);
  return [value, update, remove];
}
