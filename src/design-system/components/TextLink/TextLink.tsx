import React, { ReactNode, useCallback } from 'react';
import { Text as NativeText, TextStyle } from 'react-native';
import { useOpenInBrowser } from '@/hooks/useOpenInBrowser';

const style: TextStyle = {
  textDecorationLine: 'underline',
};

export interface TextLinkProps {
  url: string;
  children: ReactNode;
  handleLinkPress?: (url: string) => void;
}

/**
 * @description Renders a plain, static text link, designed to be used within a
 * block of text.
 */
export function TextLink({ children, url, handleLinkPress }: TextLinkProps) {
  const openInBrowser = useOpenInBrowser();

  const onPressHandler = useCallback(() => {
    if (handleLinkPress) {
      handleLinkPress(url);
    } else {
      openInBrowser(url);
    }
  }, [handleLinkPress, openInBrowser, url]);

  return (
    <NativeText onPress={onPressHandler} style={style}>
      {children}
    </NativeText>
  );
}
