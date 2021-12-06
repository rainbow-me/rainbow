import React from 'react';
import { ButtonPressAnimation } from '../animations';
// @ts-expect-error ts-migrate(6142) FIXME: Module './FloatingEmojis' was resolved to '/Users/... Remove this comment to see the full error message
import FloatingEmojis from './FloatingEmojis';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useClipboard } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { magicMemo } from '@rainbow-me/utils';

const CopyFloatingEmojis = ({
  children,
  disabled,
  onPress,
  textToCopy,
  ...props
}: any) => {
  const { setClipboard } = useClipboard();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <FloatingEmojis
      distance={250}
      duration={500}
      fadeOut={false}
      scaleTo={0}
      size={50}
      wiggleFactor={0}
      {...props}
    >
      {({ onNewEmoji }: any) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
