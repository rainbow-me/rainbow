import type { HostComponent, ViewProps, ViewStyle } from 'react-native';

import type { SharedValue } from 'react-native-reanimated';

export type UniqueIdentifier = string | number;
export type ObjectWithId = { id: UniqueIdentifier; [s: string]: unknown };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyData = Record<string, any>;
export type Data<T = AnyData> = T | SharedValue<T>;
export type SharedData<T = AnyData> = SharedValue<T>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NativeElement = InstanceType<HostComponent<ViewProps>>;

export type AnimatedStyleWorklet<T extends ViewStyle = ViewStyle> = (
  style: Readonly<T>,
  options: { isActive: boolean; isDisabled: boolean; isActing?: boolean }
) => T;
