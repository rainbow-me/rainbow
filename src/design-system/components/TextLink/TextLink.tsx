import React, { ReactNode, useCallback, useMemo } from 'react';
import { Linking, Text as NativeText } from 'react-native';
import { useForegroundColor } from '../../color/useForegroundColor';

export interface TextLinkProps {
  url: string;
  children: ReactNode;
}

export function TextLink({ children, url }: TextLinkProps) {
  const actionColor = useForegroundColor('action');

  return (
    <NativeText
      onPress={useCallback(() => Linking.openURL(url), [url])}
      style={useMemo(() => ({ color: actionColor }), [actionColor])}
    >
      {children}
    </NativeText>
  );
}
