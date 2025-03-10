import React, { ReactNode, useCallback } from 'react';
import { Text as NativeText, TextStyle } from 'react-native';
import { openInBrowser } from '@/utils/openInBrowser';

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
  const onPressHandler = useCallback(() => {
    if (handleLinkPress) {
      handleLinkPress(url);
    } else {
      openInBrowser(url);
    }
  }, [handleLinkPress, url]);

  return (
    <NativeText onPress={onPressHandler} style={style}>
      {children}
    </NativeText>
  );
}
