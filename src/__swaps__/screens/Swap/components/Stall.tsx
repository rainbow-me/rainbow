import { PropsWithChildren, ReactNode, useState } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

export function Stall({
  isStalledWorklet,
  placeholder,
  children,
}: PropsWithChildren<{ placeholder: ReactNode; isStalledWorklet: () => boolean }>) {
  const [isStalled, setIsStalled] = useState(false);

  useAnimatedReaction(isStalledWorklet, v => runOnJS(setIsStalled)(v), [setIsStalled]);

  if (isStalled) return placeholder;
  return children;
}
