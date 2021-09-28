/* eslint-disable sort-keys-fix/sort-keys-fix */
import React, { ReactNode, useMemo } from 'react';
import { Text as NativeText } from 'react-native';
import { useColorModeValue } from '../../contexts/ColorMode/ColorMode';
import { foreground } from '../../tokens/palette';
import { textVariants } from '../../tokens/typography';

const tones = {
  neutral: foreground.neutral,
  secondary: foreground.secondary,
  tertiary: foreground.tertiary,
  action: foreground.action,
} as const;

interface TextStyle {
  align?: 'auto' | 'center' | 'left' | 'justify' | 'right';
  tone?: keyof typeof tones;
  variant: keyof typeof textVariants;
  numeric?: boolean;
}

export const useTextStyle = ({
  align: textAlign,
  tone = 'neutral',
  variant = 'title',
  numeric = false,
}: TextStyle) => {
  const colorModeValue = useColorModeValue();
  const variantStyles = textVariants[variant];

  return useMemo(
    () => ({
      textStyle: {
        textAlign,
        color: colorModeValue(tones[tone]),
        ...variantStyles,
        ...(numeric
          ? {
              fontVariant: ['tabular-nums' as const],
            }
          : {}),
      },
      // https://github.com/facebook/react-native/issues/29232#issuecomment-889767516
      // On Android, space between lines of multiline text seems to be irregular
      // when using certain fonts.
      // The workaround posted on GitHub adds 1 to the line height correction node but
      // this adds a noticeable amount of space below the baseline. The workaround still
      // seems to work as long as the line height differs from the parent node.
      // To remove this additional space we've dropped the line height offset to an
      // arbitrarily small number that's close to zero.
      lineHeightFixNode:
        android && variantStyles.lineHeight !== undefined ? (
          <NativeText
            style={{ lineHeight: variantStyles.lineHeight - 0.001 }}
          />
        ) : null,
    }),
    [variantStyles, textAlign, colorModeValue, tone, numeric]
  );
};

interface TextProps extends TextStyle {
  children: ReactNode;
}

export const Text = ({
  align,
  tone,
  children,
  variant,
  numeric,
}: TextProps) => {
  const { textStyle, lineHeightFixNode } = useTextStyle({
    align,
    tone,
    variant,
    numeric,
  });

  return (
    <NativeText allowFontScaling={false} style={textStyle}>
      {children}
      {lineHeightFixNode}
    </NativeText>
  );
};
