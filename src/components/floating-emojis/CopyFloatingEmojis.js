import React from 'react';
import { useClipboard } from '../../hooks';
import { haptics, magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import FloatingEmojis from './FloatingEmojis';

const CopyFloatingEmojis = ({ children, onPress, textToCopy, ...props }) => {
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
          onPress={() => {
            haptics.impactLight();
            onNewEmoji();
            setClipboard(textToCopy);
            onPress(textToCopy);
          }}
        >
          {children}
        </ButtonPressAnimation>
      )}
    </FloatingEmojis>
  );
};

export default magicMemo(CopyFloatingEmojis, 'textToCopy');
