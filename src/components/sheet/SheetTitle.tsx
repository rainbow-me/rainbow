import React from 'react';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts } from '@rainbow-me/styles';

export default function SheetTitle({
  size = fonts.size.large,
  weight = fonts.weight.heavy,
  ...props
}) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Text
      align="center"
      color={colors.dark}
      letterSpacing="roundedMedium"
      size={size}
      weight={weight}
      {...props}
    />
  );
}
