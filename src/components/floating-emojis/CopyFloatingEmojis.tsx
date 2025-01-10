import React, { FC, ReactNode } from 'react';
import { ButtonPressAnimation } from '../animations';
import FloatingEmojis from './FloatingEmojis';
import { useClipboard } from '@/hooks';
import { magicMemo } from '@/utils';

interface CopyFloatingEmojisProps {
  /** Child elements or nodes to render inside this component */
  children?: ReactNode;
  /** Whether the floating emojis and copy functionality is disabled */
  disabled?: boolean;
  /**
   * Callback to run on press.
   * Receives `textToCopy` (if provided) as an argument.
   */
  onPress?: (textToCopy?: string) => void;
  /** The text that should be copied to the clipboard */
  textToCopy?: string;
  /** Any additional props you want to forward to FloatingEmojis */
  [key: string]: unknown;
}

const CopyFloatingEmojis: FC<CopyFloatingEmojisProps> = ({ children, disabled = false, onPress, textToCopy, ...props }) => {
  const { setClipboard } = useClipboard();

  return (
    <FloatingEmojis emojis={['thumbs_up']} distance={250} duration={500} fadeOut={false} scaleTo={0} size={50} wiggleFactor={0} {...props}>
      {({ onNewEmoji }) => (
        <ButtonPressAnimation
          hapticType="impactLight"
          onPress={() => {
            onPress?.(textToCopy);
            if (!disabled) {
              onNewEmoji();
              if (textToCopy) {
                setClipboard(textToCopy);
              }
            }
          }}
          radiusAndroid={24}
          wrapperProps={{
            containerStyle: {
              padding: 10,
            },
          }}
        >
          {children}
        </ButtonPressAnimation>
      )}
    </FloatingEmojis>
  );
};

export default magicMemo(CopyFloatingEmojis, ['disabled', 'onPress', 'textToCopy']);
