import React, { ReactNode, useCallback } from 'react';
import { Text as NativeText, TextStyle } from 'react-native';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

const style: TextStyle = {
  textDecorationLine: 'underline',
};

export interface TextLinkProps {
  url: string;
  children: ReactNode;
}

/**
 * @description Renders a plain, static text link, designed to be used within a
 * block of text.
 */
export function TextLink({ children, url }: TextLinkProps) {
  const { navigate } = useNavigation();

  const handleExternalLink = useCallback(() => {
    navigate(Routes.EXTERNAL_LINK_WARNING_SHEET, { url });
  }, [navigate, url]);

  return (
    <NativeText onPress={handleExternalLink} style={style}>
      {children}
    </NativeText>
  );
}
