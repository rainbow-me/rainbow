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

interface LearnCardProps {
  emoji: string;
  title: string;
  category: string;
  onPress: () => void;
  gradient: string[];
  accentColor: string;
}

const LearnCard = ({
  emoji,
  title,
  category,
  onPress,
  gradient,
  accentColor,
}: LearnCardProps) => {
  return (
    <GenericCard type="square" gradient={gradient} onPress={onPress}>
      <AccentColorProvider color={accentColor}>
        <Inset space="20px">
          <Box height="full" justifyContent="space-between">
            <Inline alignHorizontal="justify">
              <Text size="13pt" weight="heavy" color="label">
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
                <NativeText style={{ fontSize: 14, paddingLeft: 1 }}>
                  {emoji}
                </NativeText>
              </Box>
            </Inline>
            <Stack space="10px">
              <Text color="accent" size="13pt" weight="bold">
                {category}
              </Text>
              <Text color="label" size="17pt" weight="heavy">
                {title}
              </Text>
            </Stack>
          </Box>
        </Inset>
      </AccentColorProvider>
    </GenericCard>
  );
};

export default LearnCard;
