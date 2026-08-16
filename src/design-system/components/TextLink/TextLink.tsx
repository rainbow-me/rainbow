import React, { useCallback, type ReactNode } from 'react';
import { Text as NativeText, type TextStyle } from 'react-native';

const style: TextStyle = {
  textDecorationLine: 'underline',
};

export interface TextLinkProps {
  children: ReactNode;
  handleLinkPress: (url: string) => void;
  url: string;
}

/**
 * @description Renders a plain, static text link, designed to be used within a
 * block of text.
 */
export function TextLink({ children, handleLinkPress, url }: TextLinkProps) {
  const onPressHandler = useCallback(() => {
    handleLinkPress(url);
  }, [handleLinkPress, url]);

  return (
    <NativeText onPress={onPressHandler} style={style}>
      {children}
    </NativeText>
  );
}
