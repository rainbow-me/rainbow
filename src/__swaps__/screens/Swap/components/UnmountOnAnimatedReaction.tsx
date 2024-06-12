import { PropsWithChildren, ReactNode, useState } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

export function UnmountOnAnimatedReaction({
  isMountedWorklet,
  placeholder,
  children,
}: PropsWithChildren<{ placeholder: ReactNode; isMountedWorklet: () => boolean }>) {
  const [isMounted, setIsMounted] = useState(false);

  useAnimatedReaction(isMountedWorklet, v => runOnJS(setIsMounted)(v));

  if (isMounted) return children;
  return placeholder;
}
