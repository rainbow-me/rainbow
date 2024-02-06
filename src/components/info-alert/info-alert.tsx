import React from 'react';
import { Box, Text, useForegroundColor } from '@/design-system';

type InfoAlertProps = {
  title: string;
  description: string;
  rightIcon: React.ReactNode;
};

export const InfoAlert: React.FC<InfoAlertProps> = ({ rightIcon, title, description }) => {
  return (
    <Box
      style={{
        gap: 12,
        borderWidth: 2,
        borderColor: 'red',
      }}
      flexDirection="row"
      borderRadius={20}
      alignItems="center"
      justifyContent="flex-start"
      paddingHorizontal="20px"
      paddingVertical="16px"
    >
      <Box width={{ custom: 20 }} height={{ custom: 20 }} alignItems="center">
        {rightIcon}
      </Box>
      <Box style={{ gap: 10, paddingRight: 10 }} flexDirection="column">
        <Text color="label" size="15pt" weight="bold">
          {title}
        </Text>
        <Text color="labelTertiary" size="13pt" weight="medium">
          {description}
        </Text>
      </Box>
    </Box>
  );
};
