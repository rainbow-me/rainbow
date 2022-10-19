import {
  AccentColorProvider,
  Box,
  Inline,
  Inset,
  Stack,
  Text,
} from '@/design-system';
import { useTheme } from '@/theme';
import { Text as NativeText } from 'react-native';
import React from 'react';
import GenericCard from './GenericCard';
import { Emoji } from '../text';
import { ForegroundColor } from '@/design-system/color/palettes';

interface EducationCardProps {
  emoji: string;
  title: string;
  category: string;
  onPress: () => void;
  gradient: string[];
  accentColor: string;
  shadowColor: ForegroundColor;
  height: number;
}

const EducationCard = ({
  emoji,
  title,
  category,
  onPress,
  gradient,
  accentColor,
  shadowColor,
  height,
}: EducationCardProps) => {
  return (
    <GenericCard
      type="stretch"
      gradient={gradient}
      onPress={onPress}
      shadowColor={shadowColor}
      height={height}
    >
      <AccentColorProvider color={accentColor}>
        <Box height="full" justifyContent="space-between">
          <Inline alignHorizontal="justify">
            <Stack space="12px">
              <Text size="13pt" weight="bold" color="accent">
                Staying Safe
              </Text>
              <Text size="22pt" weight="heavy" color="labelWhite">
                Protect your wallet
              </Text>
            </Stack>
            <Box
              width={{ custom: 36 }}
              height={{ custom: 36 }}
              borderRadius={18}
              background="accent"
              alignItems="center"
              justifyContent="center"
            >
              <NativeText style={{ fontSize: 14, paddingLeft: 1 }}>
                {emoji}
              </NativeText>
            </Box>
          </Inline>
          <Text
            color="labelWhite"
            size="13pt"
            weight="semibold"
            numberOfLines={3}
          >
            One of the best parts of having an Ethereum wallet like Rainbow is
            that you are in total control of your money. Unlike a bank account
            from Wells Fargo or a crypto exchange like Coinbase, we do not hold
            your assets on your behalf.
          </Text>
        </Box>
      </AccentColorProvider>
    </GenericCard>
  );
};

export default EducationCard;
