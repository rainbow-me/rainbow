import React, { ReactNode, useCallback, useMemo } from 'react';
import { Linking, Text as NativeText } from 'react-native';
import { useColorModeValue } from '../../color/ColorModeValue';
import { foregroundPalette } from '../../color/palette';

export interface TextLinkProps {
  url: string;
  children: ReactNode;
}

export const TextLink = ({ children, url }: TextLinkProps) => {
  const actionColor = useColorModeValue()(foregroundPalette.action);

  return (
    <NativeText
      onPress={useCallback(() => Linking.openURL(url), [url])}
      style={useMemo(() => ({ color: actionColor }), [actionColor])}
    >
      {children}
    </NativeText>
  );
};
