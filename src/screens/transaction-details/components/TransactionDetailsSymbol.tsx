import React from 'react';
import { Bleed, Box, Text } from '@/design-system';

const SIZE = { custom: 40 };

const Icon: React.FC<{ icon: string; white?: boolean }> = ({ icon, white }) => (
  <Text color={white ? { custom: '#FFFFFF' } : 'label'} size={white ? '17pt' : '20pt'} weight="bold">
    {icon}
  </Text>
);

type Props = { icon: string; withBackground?: boolean };

export const TransactionDetailsSymbol: React.FC<Props> = ({ icon, withBackground }) => {
  if (withBackground) {
    return (
      <Box width={SIZE} height={SIZE} alignItems="center" justifyContent="center" borderRadius={20} background="blue" shadow="12px blue">
        <Icon icon={icon} white />
      </Box>
    );
  } else {
    return (
      <Box width={SIZE} alignItems="center" justifyContent="center">
        <Icon icon={icon} />
      </Box>
    );
  }
};
