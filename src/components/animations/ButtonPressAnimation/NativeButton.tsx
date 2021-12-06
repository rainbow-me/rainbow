import React, { useMemo } from 'react';
import { requireNativeComponent, View } from 'react-native';
import styled from 'styled-components';

const RawNativeButton = requireNativeComponent('Button');

const ButtonWithTransformOrigin = styled(RawNativeButton)`
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'transformOrigin' does not exist on type ... Remove this comment to see the full error message
  ${({ transformOrigin }) => {
    if (!transformOrigin) return '';
    const [x, y] = transformOrigin;
    // 👇️ Here we want to set the button's top / left
    // properties (relative to the parent wrapper view) to
    // values opposite of the provided transformOrigin.
    // This is necessary to do in order for the `transformOrigin` prop to
    // work with NativeButton without effecting NativeButton's layout.
    return `
      ${x !== 0.5 ? `left: ${x + 0.5 * (x > 0.5 ? 100 : -100)}%;` : ''}
      ${y !== 0.5 ? `top: ${y + 0.5 * (y > 0.5 ? 100 : -100)}%;` : ''}
    `;
  }};
`;

export function normalizeTransformOrigin(transformOrigin: any) {
  if (Array.isArray(transformOrigin) && transformOrigin.length === 2) {
    return transformOrigin;
  }

  switch (transformOrigin) {
    case 'bottom':
      return [0.5, 1];
    case 'left':
      return [0, 0.5];
    case 'right':
      return [1, 0.5];
    case 'top':
      return [0.5, 1];
    default:
      return undefined;
  }
}

const NativeButton = (
  { compensateForTransformOrigin, transformOrigin, testID, ...props }: any,
  ref: any
) => {
  const normalizedTransformOrigin = useMemo(
    () => normalizeTransformOrigin(transformOrigin),
    [transformOrigin]
  );

  return compensateForTransformOrigin ? (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <View>
      {/*
        👆️ This wrapper View is necessary.
        In order to compensate for the way our NativeButton's transformOrigin effects layout/positioning,
        we set the NativeButton's left / top values relative to this wrapper View.
      */}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonWithTransformOrigin
        {...props}
        ref={ref}
        testID={testID}
        transformOrigin={normalizedTransformOrigin}
      />
    </View>
  ) : (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <RawNativeButton
      {...props}
      ref={ref}
      testID={testID}
      transformOrigin={normalizedTransformOrigin}
    />
  );
};

export default React.forwardRef(NativeButton);
