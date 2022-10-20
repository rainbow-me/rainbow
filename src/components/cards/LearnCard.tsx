import {
  AccentColorProvider,
  Box,
  Inline,
  Inset,
  Stack,
  Text,
} from '@/design-system';
import { useTheme } from '@/theme';
import { Linking, Text as NativeText } from 'react-native';
import React from 'react';
import GenericCard from './GenericCard';
import { Emoji } from '../text';
import { ForegroundColor } from '@/design-system/color/palettes';
import { LearnCardDetails, learnCategoryColors } from './constants';
import IconOrb from './IconOrb';

interface LearnCardProps {
  cardDetails: LearnCardDetails;
  type: 'square' | 'stretch';
}

const LearnCard = ({ cardDetails, type }: LearnCardProps) => {
  const { category, title, emoji, url, description } = cardDetails;
  const { gradient, shadowColor, accentColor } = learnCategoryColors[category];

  return (
    <GenericCard
      type={type}
      gradient={gradient}
      onPress={() => Linking.openURL(url)}
      shadowColor={shadowColor}
    >
      <AccentColorProvider color={accentColor}>
        {type === 'square' ? (
          <Box height="full" justifyContent="space-between">
            <Inline alignHorizontal="justify">
              <Text size="13pt" weight="heavy" color="labelWhite">
                􀫸 LEARN
              </Text>
              <Box
                width={{ custom: 36 }}
                height={{ custom: 36 }}
                borderRadius={18}
                background="accent"
                alignItems="center"
                justifyContent="center"
              >
                <NativeText style={{ fontSize: 14, textAlign: 'center' }}>
                  {emoji}
                </NativeText>
              </Box>
            </Inline>
            <Stack space="10px">
              <Text color="accent" size="13pt" weight="bold">
                {category}
              </Text>
              <Text color="labelWhite" size="17pt" weight="heavy">
                {title}
              </Text>
            </Stack>
          </Box>
        ) : (
          <Stack space="36px">
            <Inline alignHorizontal="justify">
              <Stack space="12px">
                <Text size="13pt" weight="bold" color="accent">
                  {category}
                </Text>
                <Text size="22pt" weight="heavy" color="labelWhite">
                  {title}
                </Text>
              </Stack>
              <IconOrb color={accentColor}>
                <NativeText style={{ fontSize: 14, textAlign: 'center' }}>
                  {emoji}
                </NativeText>
              </IconOrb>
            </Inline>
            <Text
              color="labelWhite"
              size="13pt"
              weight="semibold"
              numberOfLines={3}
            >
              {description}
            </Text>
          </Stack>
        )}
      </AccentColorProvider>
    </GenericCard>
  );
};

export default LearnCard;
