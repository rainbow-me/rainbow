import React from 'react';
import { AccentColorProvider, Box } from '@/design-system';
import { useTheme } from '@/theme';

interface IconOrbProps {
  children: React.ReactNode;
  color: string;
  shadowColor?: 'accent' | 'shadow';
}

const IconOrb = ({ children, color, shadowColor }: IconOrbProps) => {
  const { isDarkMode } = useTheme();

  return (
    <AccentColorProvider color={color}>
      {shadowColor ? (
        <Box
          width={{ custom: 36 }}
          height={{ custom: 36 }}
          borderRadius={18}
          background="accent"
          alignItems="center"
          justifyContent="center"
          shadow={{
            custom: {
              android: {
                color: isDarkMode ? 'shadow' : shadowColor,
                elevation: 24,
                opacity: 0.5,
              },
              ios: [
                {
                  blur: 24,
                  color: isDarkMode ? 'shadow' : shadowColor,
                  offset: { x: 0, y: 8 },
                  opacity: 0.35,
                },
              ],
            },
          }}
        >
          {children}
        </Box>
      ) : (
        <Box
          width={{ custom: 36 }}
          height={{ custom: 36 }}
          borderRadius={18}
          background="accent"
          alignItems="center"
          justifyContent="center"
        >
          {children}
        </Box>
      )}
    </AccentColorProvider>
  );
};

export default IconOrb;
