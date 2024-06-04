import { PropsWithChildren, useState } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

export function ReanimatedPanelWrapper({ isOpenReaction, children }: PropsWithChildren<{ isOpenReaction: () => boolean }>) {
  const [isOpen, setIsOpen] = useState(false);

  useAnimatedReaction(isOpenReaction, v => runOnJS(setIsOpen)(v), [setIsOpen]);

  if (!isOpen) return null;
  return children;
}
