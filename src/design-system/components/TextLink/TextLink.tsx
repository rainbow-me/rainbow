import React, { ReactNode, useCallback, useMemo } from 'react';
import { Linking, Text as NativeText } from 'react-native';
import { useForegroundColor } from '../../color/useForegroundColor';

export interface TextLinkProps {
  url: string;
  children: ReactNode;
}

/**
 * @description Renders a plain, static text link, designed to be used within a
 * block of text.
 */
export function TextLink({ children, url }: TextLinkProps) {
  const accentColor = useForegroundColor('accent');

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <NativeText
      onPress={useCallback(() => Linking.openURL(url), [url])}
      style={useMemo(() => ({ color: accentColor }), [accentColor])}
    >
      {children}
    </NativeText>
  );
}
