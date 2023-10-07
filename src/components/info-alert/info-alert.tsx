import React from 'react';
import { Image } from 'react-native';
import { Box, Text } from '@/design-system';
import { colors } from '@/styles';

type InfoAlertProps = {
  title: string;
  description: string;
} & (
  | { rightIcon: React.ReactNode; imageUrl?: never }
  | { rightIcon?: never; imageUrl: string }
);

const InfoAlert: React.FC<InfoAlertProps> = ({
  rightIcon,
  imageUrl,
  title,
  description,
}) => {
  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 12,
        alignSelf: 'stretch',
        borderWidth: 2,
        borderColor: colors.separatorTertiary,
      }}
      borderRadius={20}
      justifyContent="center"
      alignItems="center"
      paddingHorizontal="16px"
      paddingVertical="20px"
    >
      <Box
        style={{ display: 'flex' }}
        width={{ custom: 20 }}
        height={{ custom: 20 }}
        justifyContent="space-between"
        alignItems="center"
      >
        {rightIcon ? (
          rightIcon
        ) : (
          <Box
            as={Image}
            source={{ uri: imageUrl }}
            width="full"
            height="full"
          />
        )}
      </Box>
      <Box style={{ display: 'flex', gap: 10 }} flexDirection="column">
        <Text color="label" size="15pt" weight="heavy">
          {title}
        </Text>
        <Text
          color="labelTertiary"
          size="13pt"
          weight="medium"
          style={{ letterSpacing: '0.54px' }}
        >
          {description}
        </Text>
      </Box>
    </Box>
  );
};

export default InfoAlert;
