import MaskedView from '@react-native-masked-view/masked-view';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {
  Bleed,
  Box,
  Column,
  Columns,
  Heading,
  Stack,
  Text,
} from '@rainbow-me/design-system';

const InfoRow = ({
  icon,
  title,
  description,
  gradient,
}: {
  icon: string;
  title: string;
  description: string;
  gradient: string[];
}) => (
  <Columns space={{ custom: 13 }}>
    <Column width="content">
      <MaskedView
        maskElement={
          <Box
            {...(android && {
              paddingTop: '6px',
            })}
          >
            <Heading
              align="center"
              color="action"
              size="28px / 33px (Deprecated)"
              weight="bold"
            >
              {icon}
            </Heading>
          </Box>
        }
        style={{ width: 42 }}
      >
        <Box
          as={LinearGradient}
          colors={gradient}
          end={{ x: 0.5, y: 1 }}
          height={{ custom: 50 }}
          marginTop="-10px"
          start={{ x: 0, y: 0 }}
          width="full"
        />
      </MaskedView>
    </Column>
    <Bleed top="3px">
      <Stack space="12px">
        <Text size="16px / 22px (Deprecated)" weight="bold">
          {title}
        </Text>
        <Text
          color="secondary60"
          size="14px / 19px (Deprecated)"
          weight="medium"
        >
          {description}
        </Text>
      </Stack>
    </Bleed>
  </Columns>
);

export default InfoRow;
