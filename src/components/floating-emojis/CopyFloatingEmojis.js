import React from 'react';
import { ButtonPressAnimation } from '../animations';
import FloatingEmojis from './FloatingEmojis';
import { useClipboard } from '@rainbow-me/hooks';
import { magicMemo } from '@rainbow-me/utils';

const CopyFloatingEmojis = ({
  children,
  disabled,
  onPress,
  textToCopy,
  ...props
}) => {
  const { setClipboard } = useClipboard();

  return (
    <FloatingEmojis
      distance={250}
      duration={500}
      fadeOut={false}
      scaleTo={0}
      size={50}
      wiggleFactor={0}
      {...props}
    >
      {({ onNewEmoji }) => (
        <ButtonPressAnimation
          hapticType="impactLight"
          onPress={() => {
            onPress?.(textToCopy);
            if (!disabled) {
              onNewEmoji();
              setClipboard(textToCopy);
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

export default magicMemo(CopyFloatingEmojis, [
  'disabled',
  'onPress',
  'textToCopy',
]);
