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
        gap: 12,
        borderWidth: 2,
        borderColor: colors.separatorTertiary,
      }}
      flexDirection="row"
      borderRadius={20}
      alignItems="center"
      justifyContent="flex-start"
      paddingHorizontal="20px"
      paddingVertical="16px"
    >
      <Box width={{ custom: 20 }} height={{ custom: 20 }} alignItems="center">
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
      <Box style={{ gap: 10 }} flexDirection="column">
        <Text color="label" size="15pt" weight="heavy">
          {title}
        </Text>
        <Text color="labelTertiary" size="13pt" weight="medium">
          {description}
        </Text>
      </Box>
    </Box>
  );
};

export default InfoAlert;
