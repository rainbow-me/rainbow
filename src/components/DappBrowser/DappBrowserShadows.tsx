import React from 'react';
import { Box, globalColors, useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';

type ShadowTypes = 'button' | 'webview';

export const DappBrowserShadows = ({ children, type = 'button' }: { children: React.ReactNode; type?: ShadowTypes }) => {
  const { isDarkMode } = useColorMode();

  if (!IS_IOS) return <>{children}</>;

  return (
    <Box
      style={
        isDarkMode && type === 'webview'
          ? {}
          : {
              shadowColor: globalColors.grey100,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDarkMode ? 0.3 : 0.1,
              shadowRadius: 12,
            }
      }
    >
      <Box
        style={
          isDarkMode && type === 'webview'
            ? {}
            : {
                shadowColor: globalColors.grey100,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDarkMode ? 0.2 : 0.04,
                shadowRadius: 3,
              }
        }
      >
        {children}
      </Box>
    </Box>
  );
};
