import { type DerivedValue, type SharedValue } from 'react-native-reanimated';

export type SharedOrDerivedValue<T> = SharedValue<T> | DerivedValue<T>;
