import React, { Fragment } from 'react';
import { BiometryIcon } from '../icons';
import { Nbsp, Text } from '../text';
import { colors, fonts } from '@rainbow-me/styles';

export default function BiometricButtonContent({
  children,
  color = colors.appleBlue,
  showIcon = true,
  size = fonts.size.larger,
  testID,
  weight = fonts.weight.semibold,
  ...props
}) {
  return (
    <Text
      align="center"
      color={color}
      letterSpacing="rounded"
      size={size}
      testID={testID}
      weight={weight}
      {...props}
    >
      {!android && showIcon && (
        <Fragment>
          <BiometryIcon />
          <Nbsp />
        </Fragment>
      )}
      {children}
    </Text>
  );
}
