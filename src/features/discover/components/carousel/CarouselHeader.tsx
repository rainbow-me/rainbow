import { type ReactNode } from 'react';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Text, TextIcon } from '@/design-system';
import { SCREEN_HORIZONTAL_PADDING } from '@/features/discover/constants';

export function CarouselHeader({
  leadingAccessory,
  title,
  onPress,
}: {
  leadingAccessory?: ReactNode;
  title: string;
  onPress?: () => void;
}) {
  return (
    <Box paddingLeft={{ custom: SCREEN_HORIZONTAL_PADDING + 12 }}>
      <ButtonPressAnimation onPress={onPress} scaleTo={0.9} style={{ alignSelf: 'flex-start' }} disabled={!onPress}>
        <Box flexDirection="row" alignItems="center" gap={4}>
          {leadingAccessory}
          <Text size="22pt" weight="heavy" color="label">
            {title}
          </Text>
          {onPress && (
            <TextIcon size="icon 15px" weight="heavy" color="labelQuaternary">
              {'􀯻'}
            </TextIcon>
          )}
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
}
